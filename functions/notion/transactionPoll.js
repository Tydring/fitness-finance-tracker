import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { NOTION_API_KEY, NOTION_TRANSACTIONS_DB_ID, getNotionClient } from './client.js';
import { runTransactionPoll } from './pollHelpers.js';

export const pollNotionTransactions = onSchedule(
  {
    schedule: '*/15 * * * *',
    timeZone: 'UTC',
    secrets: [NOTION_API_KEY, NOTION_TRANSACTIONS_DB_ID],
    retryCount: 3,
  },
  async () => {
    const db = getFirestore();
    const notion = getNotionClient();
    const count = await runTransactionPoll(notion, db, NOTION_TRANSACTIONS_DB_ID.value());
    logger.info(`pollNotionTransactions: processed ${count} pages`);
  }
);
