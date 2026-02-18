import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import {
  NOTION_API_KEY,
  NOTION_WORKOUTS_DB_ID,
  getNotionClient,
} from './client.js';
import { mapNotionToWorkout } from './mappers.js';

const POLL_STATE_DOC = 'sync_meta/workout_poll_state';

export const pollNotionWorkouts = onSchedule(
  {
    schedule: '*/15 * * * *',
    timeZone: 'UTC',
    secrets: [NOTION_API_KEY, NOTION_WORKOUTS_DB_ID],
    retryCount: 3,
  },
  async () => {
    const db = getFirestore();
    const notion = getNotionClient();
    const dbId = NOTION_WORKOUTS_DB_ID.value();

    // Load last poll timestamp (default: 24 h ago on first run)
    const stateRef = db.doc(POLL_STATE_DOC);
    const stateSnap = await stateRef.get();
    const lastPolledAt = stateSnap.exists
      ? stateSnap.data().last_polled_at.toDate()
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pollStartTime = new Date();
    let processedCount = 0;
    let cursor;

    do {
      const response = await notion.databases.query({
        database_id: dbId,
        filter: {
          timestamp: 'last_edited_time',
          last_edited_time: { after: lastPolledAt.toISOString() },
        },
        sorts: [{ timestamp: 'last_edited_time', direction: 'ascending' }],
        start_cursor: cursor,
        page_size: 100,
      });

      for (const page of response.results) {
        try {
          await upsertWorkout(db, page);
          processedCount++;
        } catch (err) {
          logger.error(`pollNotionWorkouts: error syncing page ${page.id}:`, err);
          await db.collection('sync_meta').add({
            collection: 'workouts',
            notion_page_id: page.id,
            error: err.message || String(err),
            timestamp: FieldValue.serverTimestamp(),
            direction: 'notion_to_app',
          });
        }
      }

      cursor = response.has_more ? response.next_cursor : null;
    } while (cursor);

    await stateRef.set({ last_polled_at: pollStartTime }, { merge: true });
    logger.info(`pollNotionWorkouts: processed ${processedCount} pages since ${lastPolledAt.toISOString()}`);
  }
);

async function upsertWorkout(db, page) {
  const collection = db.collection('workouts');

  // Find existing Firestore doc by notion_page_id
  const snap = await collection.where('notion_page_id', '==', page.id).limit(1).get();
  const firestoreData = mapNotionToWorkout(page);

  if (!snap.empty) {
    const doc = snap.docs[0];
    const storedNotionEdited = doc.data().notion_last_edited;

    // Skip if Notion page hasn't changed since our last sync — prevents echo-back loops
    if (storedNotionEdited === page.last_edited_time) {
      logger.info(`pollNotionWorkouts: no change on page ${page.id}, skipping`);
      return;
    }

    await doc.ref.update(firestoreData);
    logger.info(`pollNotionWorkouts: updated workout ${doc.id} from Notion page ${page.id}`);
  } else {
    // New page created directly in Notion — add to Firestore
    await collection.add({ ...firestoreData, created_at: FieldValue.serverTimestamp() });
    logger.info(`pollNotionWorkouts: created workout from Notion page ${page.id}`);
  }
}
