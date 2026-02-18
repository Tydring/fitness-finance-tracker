import { FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { mapNotionToWorkout, mapNotionToTransaction } from './mappers.js';

const WORKOUT_POLL_STATE = 'sync_meta/workout_poll_state';
const TRANSACTION_POLL_STATE = 'sync_meta/transaction_poll_state';

async function upsertDoc(db, page, collectionName, mapper) {
  const col = db.collection(collectionName);
  const snap = await col.where('notion_page_id', '==', page.id).limit(1).get();
  const firestoreData = mapper(page);

  if (!snap.empty) {
    const docSnap = snap.docs[0];
    // Skip if Notion page hasn't changed since our last sync
    if (docSnap.data().notion_last_edited === page.last_edited_time) {
      logger.info(`pollHelpers: no change on page ${page.id} (${collectionName}), skipping`);
      return;
    }
    await docSnap.ref.update(firestoreData);
    logger.info(`pollHelpers: updated ${collectionName}/${docSnap.id} from Notion page ${page.id}`);
  } else {
    await col.add({ ...firestoreData, created_at: FieldValue.serverTimestamp() });
    logger.info(`pollHelpers: created ${collectionName} doc from Notion page ${page.id}`);
  }
}

async function queryAndUpsert(notion, db, { dbId, collectionName, mapper, lastPolledAt }) {
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
        await upsertDoc(db, page, collectionName, mapper);
        processedCount++;
      } catch (err) {
        logger.error(`pollHelpers: error on page ${page.id} (${collectionName}):`, err);
        await db.collection('sync_meta').add({
          collection: collectionName,
          notion_page_id: page.id,
          error: err.message || String(err),
          timestamp: FieldValue.serverTimestamp(),
          direction: 'notion_to_app',
        });
      }
    }

    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);

  return processedCount;
}

export async function runWorkoutPoll(notion, db, dbId) {
  const stateRef = db.doc(WORKOUT_POLL_STATE);
  const stateSnap = await stateRef.get();
  const lastPolledAt = stateSnap.exists
    ? stateSnap.data().last_polled_at.toDate()
    : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const pollStartTime = new Date();
  const count = await queryAndUpsert(notion, db, {
    dbId,
    collectionName: 'workouts',
    mapper: mapNotionToWorkout,
    lastPolledAt,
  });
  await stateRef.set({ last_polled_at: pollStartTime }, { merge: true });
  return count;
}

export async function runTransactionPoll(notion, db, dbId) {
  const stateRef = db.doc(TRANSACTION_POLL_STATE);
  const stateSnap = await stateRef.get();
  const lastPolledAt = stateSnap.exists
    ? stateSnap.data().last_polled_at.toDate()
    : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const pollStartTime = new Date();
  const count = await queryAndUpsert(notion, db, {
    dbId,
    collectionName: 'transactions',
    mapper: mapNotionToTransaction,
    lastPolledAt,
  });
  await stateRef.set({ last_polled_at: pollStartTime }, { merge: true });
  return count;
}
