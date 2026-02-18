import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { NOTION_API_KEY, NOTION_WORKOUTS_DB_ID, getNotionClient } from './client.js';
import { runWorkoutPoll } from './pollHelpers.js';

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
    const count = await runWorkoutPoll(notion, db, NOTION_WORKOUTS_DB_ID.value());
    logger.info(`pollNotionWorkouts: processed ${count} pages`);
  }
);
