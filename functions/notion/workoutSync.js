import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import {
  NOTION_API_KEY,
  NOTION_WORKOUTS_DB_ID,
  getNotionClient,
} from './client.js';
import { mapWorkoutToNotion } from './mappers.js';
import { isRetryableError } from '../utils/retry.js';

export const onWorkoutWrite = onDocumentWritten(
  {
    document: 'workouts/{docId}',
    secrets: [NOTION_API_KEY, NOTION_WORKOUTS_DB_ID],
    maxInstances: 2,
    retry: true,
  },
  async (event) => {
    const { docId } = event.params;
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();
    const notion = getNotionClient();
    const dbId = NOTION_WORKOUTS_DB_ID.value();

    try {
      // --- DELETE: archive the Notion page ---
      if (!afterData) {
        const pageId = beforeData?.notion_page_id;
        if (pageId) {
          await notion.pages.update({ page_id: pageId, archived: true });
          logger.info(`Archived Notion page ${pageId} for deleted workout ${docId}`);
        }
        return;
      }

      // --- LOOP GUARD: skip write-back echoes and already-resolved conflicts ---
      if (afterData.notion_page_id && ['synced', 'conflict'].includes(afterData.sync_status)) {
        logger.info(`Skipping ${afterData.sync_status} workout ${docId}`);
        return;
      }

      // --- SKIP non-app sources (poll write-backs land here if sync_status wasn't caught above) ---
      if (afterData.source !== 'app') {
        logger.info(`Skipping non-app source (${afterData.source}) for workout ${docId}`);
        return;
      }

      // --- LAST-WRITE-WINS: if Notion was edited more recently, Notion wins ---
      const notionLastEdited = afterData.notion_last_edited ? new Date(afterData.notion_last_edited) : null;
      const appUpdatedAt = afterData.updated_at?.toDate?.() ?? null;
      if (notionLastEdited && appUpdatedAt && notionLastEdited > appUpdatedAt) {
        logger.warn(`LWW conflict for workout ${docId}: Notion (${notionLastEdited.toISOString()}) > App (${appUpdatedAt.toISOString()}), Notion wins`);
        const docRef = getFirestore().doc(`workouts/${docId}`);
        await docRef.update({ sync_status: 'conflict' });
        await getFirestore().collection('sync_meta').add({
          collection: 'workouts',
          docId,
          conflict: true,
          winner: 'notion',
          notion_time: notionLastEdited.toISOString(),
          app_time: appUpdatedAt.toISOString(),
          timestamp: new Date(),
        });
        return;
      }

      const properties = mapWorkoutToNotion(docId, afterData);
      let notionPageId = afterData.notion_page_id;
      let syncedLastEdited;

      if (notionPageId) {
        // --- UPDATE existing page ---
        const updated = await notion.pages.update({ page_id: notionPageId, properties });
        syncedLastEdited = updated.last_edited_time;
        logger.info(`Updated Notion page ${notionPageId} for workout ${docId}`);
      } else {
        // --- CREATE new page ---
        const created = await notion.pages.create({
          parent: { database_id: dbId },
          properties,
        });
        notionPageId = created.id;
        syncedLastEdited = created.last_edited_time;
        logger.info(`Created Notion page ${notionPageId} for workout ${docId}`);
      }

      // --- WRITE BACK sync status ---
      const docRef = getFirestore().doc(`workouts/${docId}`);
      await docRef.update({
        sync_status: 'synced',
        notion_page_id: notionPageId,
        notion_last_edited: syncedLastEdited,
      });
    } catch (error) {
      logger.error(`Sync error for workout ${docId}:`, error);

      if (isRetryableError(error)) {
        throw error; // Cloud Functions will retry
      }

      // Permanent failure — mark as conflict and log to sync_meta
      const docRef = getFirestore().doc(`workouts/${docId}`);
      await docRef.update({ sync_status: 'conflict' });
      await getFirestore().collection('sync_meta').add({
        collection: 'workouts',
        docId,
        error: error.message || String(error),
        status: error.status ?? null,
        timestamp: new Date(),
      });
    }
  }
);
