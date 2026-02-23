// Exercise → Category mapping
// Categories: Strength - Upper, Strength - Lower, Strength - Full Body, Cardio, Flexibility

export const CATEGORIES = [
    'Strength - Upper',
    'Strength - Lower',
    'Strength - Full Body',
    'Cardio',
    'Flexibility'
];

export const EXERCISE_CATEGORY_MAP = {
    'Bench Press': 'Strength - Upper',
    'Incline Bench Press': 'Strength - Upper',
    'Shoulder Press': 'Strength - Upper',
    'Lateral Raises': 'Strength - Upper',
    'Bicep Curls': 'Strength - Upper',
    'Tricep Extensions': 'Strength - Upper',
    'Pull-ups': 'Strength - Upper',
    'Rows': 'Strength - Upper',
    'Lat Pulldown': 'Strength - Upper',
    'Chest Fly': 'Strength - Upper',
    'Squats': 'Strength - Lower',
    'Leg Press': 'Strength - Lower',
    'Lunges': 'Strength - Lower',
    'Leg Curls': 'Strength - Lower',
    'Leg Extensions': 'Strength - Lower',
    'Calf Raises': 'Strength - Lower',
    'Deadlift': 'Strength - Full Body',
    'Romanian Deadlift': 'Strength - Lower',
    'Running': 'Cardio',
    'Cycling': 'Cardio',
    'Walking': 'Cardio',
    'Hiking': 'Cardio',
    'Apple Fitness+': 'Cardio',
    'Jump Rope': 'Cardio',
    'Planks': 'Flexibility',
    'Stretching': 'Flexibility'
};

export const EXERCISES = Object.keys(EXERCISE_CATEGORY_MAP);

/**
 * Returns whether the exercise is a strength exercise (needs sets/reps/weight)
 */
export const isStrengthExercise = (exercise) => {
    const cat = EXERCISE_CATEGORY_MAP[exercise];
    return cat?.startsWith('Strength');
};

/**
 * Returns whether the exercise is cardio (needs duration/distance)
 */
export const isCardioExercise = (exercise) => {
    return EXERCISE_CATEGORY_MAP[exercise] === 'Cardio';
};

/**
 * Returns whether the exercise is flexibility (needs duration)
 */
export const isFlexibilityExercise = (exercise) => {
    return EXERCISE_CATEGORY_MAP[exercise] === 'Flexibility';
};
