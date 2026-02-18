import { onCall } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import {
  NOTION_API_KEY,
  NOTION_WORKOUTS_DB_ID,
  NOTION_TRANSACTIONS_DB_ID,
  getNotionClient,
} from './client.js';
import { runWorkoutPoll, runTransactionPoll } from './pollHelpers.js';

export const manualSync = onCall(
  {
    secrets: [NOTION_API_KEY, NOTION_WORKOUTS_DB_ID, NOTION_TRANSACTIONS_DB_ID],
  },
  async () => {
    const db = getFirestore();
    const notion = getNotionClient();

    const [workoutsSynced, transactionsSynced] = await Promise.all([
      runWorkoutPoll(notion, db, NOTION_WORKOUTS_DB_ID.value()),
      runTransactionPoll(notion, db, NOTION_TRANSACTIONS_DB_ID.value()),
    ]);

    logger.info(`manualSync: workouts=${workoutsSynced}, transactions=${transactionsSynced}`);
    return { ok: true, workouts_synced: workoutsSynced, transactions_synced: transactionsSynced };
  }
);
