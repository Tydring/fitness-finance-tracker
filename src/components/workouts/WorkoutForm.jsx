import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useWorkouts } from '../../hooks/useFirestore';
import { EXERCISE_CATEGORY_MAP, isStrengthExercise, isCardioExercise, isFlexibilityExercise } from '../../config/exercises';
import { todayISO, dateInputToTimestamp } from '../../utils/dateHelpers';
import ExerciseSelect from './ExerciseSelect';
import './WorkoutForm.css';

const INITIAL_STATE = {
    name: '',
    date: todayISO(),
    exercise: '',
    category: '',
    sets: '',
    reps: '',
    weight_kg: '',
    duration_min: '',
    distance_km: '',
    rpe: 5,
    notes: ''
};

const WorkoutForm = () => {
    const [form, setForm] = useState(INITIAL_STATE);
    const [saving, setSaving] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addItem, updateItem } = useWorkouts();

    const editId = searchParams.get('edit');

    // Auto-fill category when exercise changes
    useEffect(() => {
        if (form.exercise) {
            setForm((prev) => ({
                ...prev,
                category: EXERCISE_CATEGORY_MAP[prev.exercise] || ''
            }));
        }
    }, [form.exercise]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
        }));
    };

    const handleRPEChange = (e) => {
        setForm((prev) => ({ ...prev, rpe: Number(e.target.value) }));
    };

    const handleRepeatLast = async () => {
        if (!form.exercise) return;
        try {
            const q = query(
                collection(db, 'workouts'),
                where('exercise', '==', form.exercise),
                orderBy('date', 'desc'),
                limit(1)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                const last = snap.docs[0].data();
                setForm((prev) => ({
                    ...prev,
                    sets: last.sets || '',
                    reps: last.reps || '',
                    weight_kg: last.weight_kg || '',
                    duration_min: last.duration_min || '',
                    distance_km: last.distance_km || '',
                    rpe: last.rpe || 5,
                }));
            }
        } catch (err) {
            console.error('Failed to fetch last workout:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const workoutData = {
                name: form.name || `${form.exercise} - ${form.date}`,
                date: dateInputToTimestamp(form.date),
                exercise: form.exercise,
                category: form.category,
                sets: form.sets || null,
                reps: form.reps || null,
                weight_kg: form.weight_kg || null,
                duration_min: form.duration_min || null,
                distance_km: form.distance_km || null,
                rpe: form.rpe || null,
                notes: form.notes
            };

            if (editId) {
                await updateItem(editId, workoutData);
            } else {
                await addItem(workoutData);
            }

            navigate('/workouts');
        } catch (err) {
            console.error('Failed to save workout:', err);
        } finally {
            setSaving(false);
        }
    };

    const showStrength = isStrengthExercise(form.exercise);
    const showCardio = isCardioExercise(form.exercise);
    const showFlexibility = isFlexibilityExercise(form.exercise);

    return (
        <div className="page-container">
            <h2 className="form-title">{editId ? 'Edit Workout' : 'Log Workout'}</h2>

            <form onSubmit={handleSubmit} className="workout-form">
                {/* Name */}
                <div className="form-group">
                    <label htmlFor="name">Name (optional)</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Morning Push Day"
                    />
                </div>

                {/* Date */}
                <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input
                        id="date"
                        name="date"
                        type="date"
                        value={form.date}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Exercise */}
                <div className="form-group">
                    <label htmlFor="exercise">Exercise</label>
                    <ExerciseSelect
                        value={form.exercise}
                        onChange={(e) => setForm((prev) => ({ ...prev, exercise: e.target.value }))}
                    />
                </div>

                {/* Category (read-only, auto-filled) */}
                {form.category && (
                    <div className="form-group">
                        <label>Category</label>
                        <div className="category-badge">{form.category}</div>
                    </div>
                )}

                {/* Repeat Last Button */}
                {form.exercise && (
                    <button type="button" className="btn-repeat" onClick={handleRepeatLast}>
                        ↻ Repeat last {form.exercise}
                    </button>
                )}

                {/* Conditional: Strength fields */}
                {showStrength && (
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="sets">Sets</label>
                            <input id="sets" name="sets" type="number" min="1" max="20"
                                value={form.sets} onChange={handleChange} placeholder="3" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reps">Reps</label>
                            <input id="reps" name="reps" type="number" min="1" max="100"
                                value={form.reps} onChange={handleChange} placeholder="10" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="weight_kg">Weight (kg)</label>
                            <input id="weight_kg" name="weight_kg" type="number" min="0" step="0.5"
                                value={form.weight_kg} onChange={handleChange} placeholder="60" />
                        </div>
                    </div>
                )}

                {/* Conditional: Cardio fields */}
                {(showCardio || showFlexibility) && (
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="duration_min">Duration (min)</label>
                            <input id="duration_min" name="duration_min" type="number" min="1"
                                value={form.duration_min} onChange={handleChange} placeholder="30" />
                        </div>
                        {showCardio && (
                            <div className="form-group">
                                <label htmlFor="distance_km">Distance (km)</label>
                                <input id="distance_km" name="distance_km" type="number" min="0" step="0.1"
                                    value={form.distance_km} onChange={handleChange} placeholder="5.0" />
                            </div>
                        )}
                    </div>
                )}

                {/* RPE */}
                {form.exercise && (
                    <div className="form-group">
                        <label htmlFor="rpe">RPE (Rate of Perceived Exertion): {form.rpe}</label>
                        <input
                            id="rpe"
                            name="rpe"
                            type="range"
                            min="1"
                            max="10"
                            value={form.rpe}
                            onChange={handleRPEChange}
                            className="rpe-slider"
                        />
                        <div className="rpe-labels">
                            <span>Easy</span>
                            <span>Max</span>
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div className="form-group">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Any additional notes..."
                    />
                </div>

                {/* Submit */}
                <button type="submit" className="btn btn-primary btn-submit" disabled={saving}>
                    {saving ? 'Saving...' : editId ? 'Update Workout' : 'Log Workout'}
                </button>
            </form>
        </div>
    );
};

export default WorkoutForm;
