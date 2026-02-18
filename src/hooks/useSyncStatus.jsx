import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';

/**
 * Tracks real-time sync health across workouts and transactions.
 * Returns counts of pending/conflict items and a syncNow() trigger.
 */
export function useSyncStatus() {
  const [pending, setPending] = useState(0);
  const [conflicts, setConflicts] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    // Mutable counters — updated by each snapshot independently
    const counts = {
      workouts: { pending: 0, conflict: 0 },
      transactions: { pending: 0, conflict: 0 },
    };

    const flush = () => {
      setPending(counts.workouts.pending + counts.transactions.pending);
      setConflicts(counts.workouts.conflict + counts.transactions.conflict);
    };

    const subscribe = (collName, key) =>
      onSnapshot(
        query(collection(db, collName), where('sync_status', 'in', ['pending', 'conflict'])),
        (snap) => {
          counts[key] = { pending: 0, conflict: 0 };
          snap.docs.forEach((d) => {
            const s = d.data().sync_status;
            if (s === 'pending') counts[key].pending++;
            else if (s === 'conflict') counts[key].conflict++;
          });
          flush();
        }
      );

    const unsubW = subscribe('workouts', 'workouts');
    const unsubT = subscribe('transactions', 'transactions');
    return () => { unsubW(); unsubT(); };
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const fn = httpsCallable(functions, 'manualSync');
      await fn();
      setLastSynced(new Date());
    } catch (err) {
      setSyncError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }, []);

  return { pending, conflicts, syncing, lastSynced, syncError, syncNow };
}
