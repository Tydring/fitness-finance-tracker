import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { differenceInDays, parseISO } from 'date-fns';
import { todayISO } from '../utils/dateHelpers';

export const UserStatsContext = createContext();

export const useUserStats = () => useContext(UserStatsContext);

const DEFAULT_STATS = {
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    totalWorkoutDays: 0,
    badges: [],
    freezeActive: false,
    countersInitialized: false,
    totalStrength: 0,
    totalCardio: 0,
    totalCore: 0,
    totalFlexibility: 0
};

const BADGES = {
    FIRST_STEP: 'First Step',
    CONSISTENCY: 'Consistency Is Key',
    CENTURY_CLUB: 'Century Club',
    SPARTAN: 'Spartan',

    HAT_TRICK: 'Hat Trick',
    WEEK_1: 'Week 1',
    ON_FIRE: 'On Fire',
    UNSTOPPABLE: 'Unstoppable',

    EARLY_BIRD: 'Early Bird',
    NIGHT_OWL: 'Night Owl',
    MARATHON_SESSION: 'Marathon Session',

    CENTURION: 'Centurion',
    IRON_CORE: 'Iron Core',
    YOGI: 'Yogi',
    CARDIO_JUNKIE: 'Cardio Junkie',

    HEAVYWEIGHT: 'Heavyweight',
    VOLUME_WARNING: 'Volume Warning',
    QUICK_BURN: 'Quick Burn',
    FULL_BODY: 'Full Body Pattern'
};

export const UserStatsProvider = ({ children }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState(DEFAULT_STATS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setStats(DEFAULT_STATS);
            setLoading(false);
            return;
        }

        const userRef = doc(db, 'users', user.uid);

        const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                // Merge with default stats in case new fields were added
                setStats({ ...DEFAULT_STATS, ...docSnapshot.data() });
            } else {
                // Initialize default stats for new user
                setDoc(userRef, DEFAULT_STATS).catch(err => console.error("Error initializing user stats:", err));
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user stats:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // One-time initialization of lifetime counters for existing users
    useEffect(() => {
        const initializeCounters = async () => {
            if (!user || loading || !stats || stats.countersInitialized) return;

            console.log("Initializing user stat counters from history...");
            try {
                const q = query(collection(db, 'workouts'), where('userId', '==', user.uid));
                const snap = await getDocs(q);

                let str = 0, cardio = 0, core = 0, flex = 0;

                snap.forEach(d => {
                    const data = d.data();
                    if (!data.category) return;
                    if (['Strength', 'Weightlifting', 'Powerlifting'].includes(data.category)) str++;
                    else if (['Cardio', 'Running', 'Cycling'].includes(data.category)) cardio++;
                    else if (data.category === 'Core') core++;
                    else if (['Flexibility', 'Stretching', 'Yoga'].includes(data.category)) flex++;
                });

                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    countersInitialized: true,
                    totalStrength: str,
                    totalCardio: cardio,
                    totalCore: core,
                    totalFlexibility: flex
                });
            } catch (err) {
                console.error("Failed to initialize counters:", err);
            }
        };

        initializeCounters();
    }, [user, loading, stats]);

    const updateWorkoutCompleted = async (workoutDateISO = todayISO(), exercisesData = []) => {
        if (!user) return null;

        const userRef = doc(db, 'users', user.uid);
        let newStats = { ...stats };
        let newBadgesUnlocked = [];

        if (!stats.lastWorkoutDate) {
            // First workout ever
            newStats.currentStreak = 1;
            newStats.longestStreak = 1;
            newStats.totalWorkoutDays = 1;
            newStats.freezeActive = false;
        } else {
            const lastDate = parseISO(stats.lastWorkoutDate);
            const todayDate = parseISO(workoutDateISO);

            const diff = Math.abs(differenceInDays(todayDate, lastDate));

            if (diff === 0) {
                // Already worked out today, no stat changes needed
                return { stats: newStats, newBadges: [] };
            } else if (diff === 1) {
                // Consecutive day
                newStats.currentStreak += 1;
                newStats.totalWorkoutDays += 1;
                newStats.freezeActive = false;
            } else if (diff === 2) {
                // Missed exactly one day: Auto-freeze activates
                newStats.currentStreak += 1;
                newStats.totalWorkoutDays += 1;
                newStats.freezeActive = true;
            } else {
                // Missed > 1 day: Streak broken
                newStats.currentStreak = 1;
                newStats.totalWorkoutDays += 1;
                newStats.freezeActive = false;
            }

            if (newStats.currentStreak > newStats.longestStreak) {
                newStats.longestStreak = newStats.currentStreak;
            }
        }

        newStats.lastWorkoutDate = workoutDateISO;

        // Badge checks
        const checkBadge = (badgeName, condition) => {
            if (condition && !newStats.badges.includes(badgeName)) {
                newStats.badges.push(badgeName);
                newBadgesUnlocked.push(badgeName);
            }
        };

        // 1. Increment Counters
        exercisesData.forEach(ex => {
            if (['Strength', 'Weightlifting', 'Powerlifting'].includes(ex.category)) {
                newStats.totalStrength = (newStats.totalStrength || 0) + 1;
            } else if (['Cardio', 'Running', 'Cycling'].includes(ex.category)) {
                newStats.totalCardio = (newStats.totalCardio || 0) + 1;
            } else if (ex.category === 'Core') {
                newStats.totalCore = (newStats.totalCore || 0) + 1;
            } else if (['Flexibility', 'Stretching', 'Yoga'].includes(ex.category)) {
                newStats.totalFlexibility = (newStats.totalFlexibility || 0) + 1;
            }
        });

        // 2. Check Vibe Badges
        const currentHour = new Date().getHours();
        const isEarlyBird = currentHour >= 4 && currentHour < 7;
        const isNightOwl = currentHour >= 22 || currentHour < 2;
        const isMarathonSession = exercisesData.some(ex => (Number(ex.duration_min) || 0) >= 90);

        checkBadge(BADGES.EARLY_BIRD, isEarlyBird);
        checkBadge(BADGES.NIGHT_OWL, isNightOwl);
        checkBadge(BADGES.MARATHON_SESSION, isMarathonSession);

        // 3. Check Milestone Badges
        checkBadge(BADGES.FIRST_STEP, newStats.totalWorkoutDays >= 1);
        checkBadge(BADGES.CONSISTENCY, newStats.totalWorkoutDays >= 10);
        checkBadge(BADGES.CENTURY_CLUB, newStats.totalWorkoutDays >= 100);
        checkBadge(BADGES.SPARTAN, newStats.totalWorkoutDays >= 300);

        // 4. Check Streak Badges
        checkBadge(BADGES.HAT_TRICK, newStats.currentStreak >= 3);
        checkBadge(BADGES.WEEK_1, newStats.currentStreak >= 7);
        checkBadge(BADGES.ON_FIRE, newStats.currentStreak >= 14);
        checkBadge(BADGES.UNSTOPPABLE, newStats.currentStreak >= 30);

        // 5. Check Identity Badges
        checkBadge(BADGES.CENTURION, newStats.totalStrength >= 100);
        checkBadge(BADGES.IRON_CORE, newStats.totalCore >= 50);
        checkBadge(BADGES.YOGI, newStats.totalFlexibility >= 50);
        checkBadge(BADGES.CARDIO_JUNKIE, newStats.totalCardio >= 50);

        // 6. Check Extra Session Badges
        if (exercisesData.length > 0) {
            // Heavyweight: Any exercise with weight >= 100kg
            const isHeavyweight = exercisesData.some(ex => (Number(ex.weight_kg) || 0) >= 100);
            checkBadge(BADGES.HEAVYWEIGHT, isHeavyweight);

            // Volume Warning: Accumulate 15+ sets across session
            const totalSets = exercisesData.reduce((acc, ex) => acc + (Number(ex.sets) || 0), 0);
            checkBadge(BADGES.VOLUME_WARNING, totalSets >= 15);

            // Quick Burn: Total duration under 20 mins, but > 0
            const totalDuration = exercisesData.reduce((acc, ex) => acc + (Number(ex.duration_min) || 0), 0);
            checkBadge(BADGES.QUICK_BURN, totalDuration > 0 && totalDuration < 20);

            // Full Body Pattern: 3+ distinct categories
            const distinctCategories = new Set(exercisesData.map(ex => ex.category).filter(Boolean));
            checkBadge(BADGES.FULL_BODY, distinctCategories.size >= 3);
        }

        try {
            await updateDoc(userRef, newStats);
            return { stats: newStats, newBadges: newBadgesUnlocked };
        } catch (err) {
            console.error("Error updating stats:", err);
            return null;
        }
    };

    return (
        <UserStatsContext.Provider value={{ stats, loading, updateWorkoutCompleted, BADGES }}>
            {children}
        </UserStatsContext.Provider>
    );
};
