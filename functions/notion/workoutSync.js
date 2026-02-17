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

      // --- LOOP GUARD: skip write-back from ourselves ---
      if (afterData.sync_status === 'synced' && afterData.notion_page_id) {
        logger.info(`Skipping write-back echo for workout ${docId}`);
        return;
      }

      // --- SKIP non-app sources ---
      if (afterData.source !== 'app') {
        logger.info(`Skipping non-app source (${afterData.source}) for workout ${docId}`);
        return;
      }

      const properties = mapWorkoutToNotion(docId, afterData);
      let notionPageId = afterData.notion_page_id;

      if (notionPageId) {
        // --- UPDATE existing page ---
        await notion.pages.update({ page_id: notionPageId, properties });
        logger.info(`Updated Notion page ${notionPageId} for workout ${docId}`);
      } else {
        // --- CREATE new page ---
        const created = await notion.pages.create({
          parent: { database_id: dbId },
          properties,
        });
        notionPageId = created.id;
        logger.info(`Created Notion page ${notionPageId} for workout ${docId}`);
      }

      // --- WRITE BACK sync status ---
      const docRef = getFirestore().doc(`workouts/${docId}`);
      await docRef.update({
        sync_status: 'synced',
        notion_page_id: notionPageId,
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
