import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Real-time listener on weekly_insights/latest.
 * Returns { insights, loading, error }.
 */
export const useWeeklyInsights = () => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const docRef = doc(db, 'weekly_insights', 'latest');

        const unsubscribe = onSnapshot(
            docRef,
            (snap) => {
                setInsights(snap.exists() ? snap.data() : null);
                setLoading(false);
            },
            (err) => {
                console.error('Weekly insights listener error:', err);
                setError(err);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    return { insights, loading, error };
};
