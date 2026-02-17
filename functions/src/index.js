import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { onWorkoutWrite } from '../notion/workoutSync.js';
export { onTransactionWrite } from '../notion/transactionSync.js';
