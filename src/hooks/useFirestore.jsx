import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    limit,
    where,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useAuth } from './useAuth';

/**
 * Generic Firestore hook for CRUD operations on a collection.
 * Subscribes to real-time updates and provides add/update/delete.
 */
export const useFirestoreCollection = (collectionName, queryConstraints = [], maxItems = 50) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Use a ref to track the query constraints to avoid unnecessary re-subscriptions
    // JSON.stringify is a simple way to deep compare array of constraints (mapped to strings mostly)
    // but Firestore query objects are complex. 
    // Instead, we will rely on the caller to memoize queryConstraints, 
    // OR just use a simple dependency check if we trust the caller.
    // For now, let's assume the caller will memoize or we use the JSON string of constraints as a key.
    const queryKey = JSON.stringify(queryConstraints.map(c => c.toString()));

    useEffect(() => {
        if (!queryConstraints) {
            setLoading(false);
            return;
        }

        const colRef = collection(db, collectionName);
        const q = query(colRef, ...queryConstraints, limit(maxItems));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const items = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                    _hasPendingWrites: docSnap.metadata.hasPendingWrites
                }));
                setData(items);
                setLoading(false);
            },
            (err) => {
                console.error(`Firestore error on ${collectionName}:`, err);
                setError(err);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [collectionName, maxItems, queryKey, queryConstraints]); // Re-run when query definition changes

    const addItem = useCallback(async (item) => {
        const colRef = collection(db, collectionName);
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('Not authenticated');
        const docData = {
            ...item,
            userId: uid,
            source: 'app',
            sync_status: 'pending',
            notion_page_id: null,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
            last_modified: serverTimestamp()
        };
        const docRef = await addDoc(colRef, docData);
        return docRef.id;
    }, [collectionName]);

    const updateItem = useCallback(async (id, updates) => {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, {
            ...updates,
            source: 'app',
            updated_at: serverTimestamp(),
            last_modified: serverTimestamp(),
            sync_status: 'pending'
        });
    }, [collectionName]);

    const deleteItem = useCallback(async (id) => {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
    }, [collectionName]);

    return { data, loading, error, addItem, updateItem, deleteItem };
};

/**
 * Hook specifically for workouts with date-ordered query.
 * Filters by current user's userId.
 */
export const useWorkouts = (maxItems = 50) => {
    const { user } = useAuth();

    const queryConstraints = useMemo(() => {
        if (!user) return null; // Return null instead of fallback to prevent premature query
        return [where('userId', '==', user.uid), orderBy('date', 'desc')];
    }, [user]);

    return useFirestoreCollection('workouts', queryConstraints, maxItems);
};

/**
 * Hook specifically for transactions with date-ordered query.
 * Filters by current user's userId.
 */
export const useTransactions = (maxItems = 50) => {
    const { user } = useAuth();

    const queryConstraints = useMemo(() => {
        if (!user) return null; // Return null instead of fallback to prevent premature query
        return [where('userId', '==', user.uid), orderBy('date', 'desc')];
    }, [user]);

    return useFirestoreCollection('transactions', queryConstraints, maxItems);
};
