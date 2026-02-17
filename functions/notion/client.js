import { defineSecret } from 'firebase-functions/params';
import { Client } from '@notionhq/client';

export const NOTION_API_KEY = defineSecret('NOTION_API_KEY');
export const NOTION_WORKOUTS_DB_ID = defineSecret('NOTION_WORKOUTS_DB_ID');
export const NOTION_TRANSACTIONS_DB_ID = defineSecret('NOTION_TRANSACTIONS_DB_ID');

let _client = null;

/**
 * Returns a lazy-initialized Notion Client.
 * Must be called inside a function handler (after secrets are resolved).
 */
export function getNotionClient() {
  if (!_client) {
    _client = new Client({ auth: NOTION_API_KEY.value() });
  }
  return _client;
}
