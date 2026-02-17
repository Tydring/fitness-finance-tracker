import { EXERCISES, EXERCISE_CATEGORY_MAP } from '../../config/exercises';

const ExerciseSelect = ({ value, onChange }) => {
    // Group exercises by category for better UX
    const grouped = EXERCISES.reduce((acc, exercise) => {
        const cat = EXERCISE_CATEGORY_MAP[exercise];
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(exercise);
        return acc;
    }, {});

    return (
        <select value={value} onChange={onChange} required>
            <option value="">Select exercise...</option>
            {Object.entries(grouped).map(([category, exercises]) => (
                <optgroup key={category} label={category}>
                    {exercises.map((ex) => (
                        <option key={ex} value={ex}>{ex}</option>
                    ))}
                </optgroup>
            ))}
        </select>
    );
};

export default ExerciseSelect;
