import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import {
  NOTION_API_KEY,
  NOTION_TRANSACTIONS_DB_ID,
  getNotionClient,
} from './client.js';
import { mapTransactionToNotion } from './mappers.js';
import { isRetryableError } from '../utils/retry.js';

export const onTransactionWrite = onDocumentWritten(
  {
    document: 'transactions/{docId}',
    secrets: [NOTION_API_KEY, NOTION_TRANSACTIONS_DB_ID],
    maxInstances: 2,
    retry: true,
  },
  async (event) => {
    const { docId } = event.params;
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();
    const notion = getNotionClient();
    const dbId = NOTION_TRANSACTIONS_DB_ID.value();

    try {
      // --- DELETE: archive the Notion page ---
      if (!afterData) {
        const pageId = beforeData?.notion_page_id;
        if (pageId) {
          await notion.pages.update({ page_id: pageId, archived: true });
          logger.info(`Archived Notion page ${pageId} for deleted transaction ${docId}`);
        }
        return;
      }

      // --- LOOP GUARD: skip write-back from ourselves ---
      if (afterData.sync_status === 'synced' && afterData.notion_page_id) {
        logger.info(`Skipping write-back echo for transaction ${docId}`);
        return;
      }

      // --- SKIP non-app sources ---
      if (afterData.source !== 'app') {
        logger.info(`Skipping non-app source (${afterData.source}) for transaction ${docId}`);
        return;
      }

      const properties = mapTransactionToNotion(docId, afterData);
      let notionPageId = afterData.notion_page_id;

      if (notionPageId) {
        // --- UPDATE existing page ---
        await notion.pages.update({ page_id: notionPageId, properties });
        logger.info(`Updated Notion page ${notionPageId} for transaction ${docId}`);
      } else {
        // --- IDEMPOTENCY CHECK: query by Firestore ID before creating ---
        const existing = await notion.databases.query({
          database_id: dbId,
          filter: {
            property: 'Firestore ID',
            rich_text: { equals: docId },
          },
          page_size: 1,
        });

        if (existing.results.length > 0) {
          notionPageId = existing.results[0].id;
          await notion.pages.update({ page_id: notionPageId, properties });
          logger.info(`Found existing Notion page ${notionPageId} for transaction ${docId} (idempotency)`);
        } else {
          // --- CREATE new page ---
          const created = await notion.pages.create({
            parent: { database_id: dbId },
            properties,
          });
          notionPageId = created.id;
          logger.info(`Created Notion page ${notionPageId} for transaction ${docId}`);
        }
      }

      // --- WRITE BACK sync status ---
      const docRef = getFirestore().doc(`transactions/${docId}`);
      await docRef.update({
        sync_status: 'synced',
        notion_page_id: notionPageId,
      });
    } catch (error) {
      logger.error(`Sync error for transaction ${docId}:`, error);

      if (isRetryableError(error)) {
        throw error; // Cloud Functions will retry
      }

      // Permanent failure — mark as conflict and log to sync_meta
      const docRef = getFirestore().doc(`transactions/${docId}`);
      await docRef.update({ sync_status: 'conflict' });
      await getFirestore().collection('sync_meta').add({
        collection: 'transactions',
        docId,
        error: error.message || String(error),
        status: error.status ?? null,
        timestamp: new Date(),
      });
    }
  }
);
