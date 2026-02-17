import { useState, useEffect, useCallback } from 'react';
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
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

/**
 * Generic Firestore hook for CRUD operations on a collection.
 * Subscribes to real-time updates and provides add/update/delete.
 */
export const useFirestoreCollection = (collectionName, queryConstraints = [], maxItems = 50) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
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
    }, [collectionName, maxItems]);

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
    const uid = auth.currentUser?.uid;
    return useFirestoreCollection(
        'workouts',
        uid ? [where('userId', '==', uid), orderBy('date', 'desc')] : [orderBy('date', 'desc')],
        maxItems
    );
};

/**
 * Hook specifically for transactions with date-ordered query.
 * Filters by current user's userId.
 */
export const useTransactions = (maxItems = 50) => {
    const uid = auth.currentUser?.uid;
    return useFirestoreCollection(
        'transactions',
        uid ? [where('userId', '==', uid), orderBy('date', 'desc')] : [orderBy('date', 'desc')],
        maxItems
    );
};
