import admin from 'firebase-admin';

// We need to point to the local emulator or use the default staging credentials
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
admin.initializeApp({ projectId: 'fitness-finance-tracker' });

async function run() {
    try {
        const snap = await admin.firestore().collection('workouts')
            .orderBy('date', 'desc')
            .limit(10)
            .get();

        console.log(`Found ${snap.size} total docs`);
        snap.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id} | USER: ${data.userId} | DATE: ${data.date?.toDate?.()?.toISOString() || data.date} | SOURCE: ${data.source} | NAME: ${data.name}`);
        });
    } catch (err) {
        console.error(err);
    }
}

run();
