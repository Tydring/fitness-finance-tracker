import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { onWorkoutWrite } from '../notion/workoutSync.js';
export { onTransactionWrite } from '../notion/transactionSync.js';
export { pollNotionWorkouts } from '../notion/workoutPoll.js';
export { pollNotionTransactions } from '../notion/transactionPoll.js';
export { manualSync } from '../notion/manualSync.js';
export { scheduledFetchRates, manualFetchRates } from '../exchange/fetchRates.js';
export { aggregateWeeklyData } from '../aggregation/aggregateWeeklyData.js';
