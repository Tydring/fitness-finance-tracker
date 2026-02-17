import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Real-time listener on the exchange_rates/latest document.
 * Returns { rates, loading, error }.
 */
export const useExchangeRates = () => {
    const [rates, setRates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const docRef = doc(db, 'exchange_rates', 'latest');

        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setRates(snapshot.data());
                } else {
                    setRates(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error('Exchange rates listener error:', err);
                setError(err);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    return { rates, loading, error };
};
