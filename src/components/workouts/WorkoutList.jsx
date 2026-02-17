import { useNavigate } from 'react-router-dom';
import { useWorkouts } from '../../hooks/useFirestore';
import { formatDate, toDate } from '../../utils/dateHelpers';
import { isStrengthExercise, isCardioExercise } from '../../config/exercises';
import { Plus, Edit2, Trash2, Dumbbell, Timer, TrendingUp } from 'lucide-react';
import './WorkoutList.css';

const WorkoutList = () => {
    const { data: workouts, loading, deleteItem } = useWorkouts();
    const navigate = useNavigate();

    const handleDelete = async (id, name) => {
        if (window.confirm(`Delete "${name}"?`)) {
            await deleteItem(id);
        }
    };

    const getSyncBadge = (workout) => {
        if (workout._hasPendingWrites) return 'pending';
        if (workout.sync_status === 'conflict') return 'conflict';
        if (workout.sync_status === 'synced') return 'synced';
        return 'pending';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Workouts</h2>
                <button
                    className="btn btn-primary btn-add"
                    onClick={() => navigate('/workouts/new')}
                >
                    <Plus size={20} />
                    <span>Log</span>
                </button>
            </div>

            {loading && <div className="loading-text">Loading workouts...</div>}

            {!loading && workouts.length === 0 && (
                <div className="empty-state">
                    <Dumbbell size={48} className="empty-icon" />
                    <p>No workouts logged yet.</p>
                    <p className="empty-hint">Tap "Log" to add your first workout!</p>
                </div>
            )}

            <div className="workout-cards">
                {workouts.map((w) => {
                    const strength = isStrengthExercise(w.exercise);
                    const cardio = isCardioExercise(w.exercise);

                    return (
                        <div key={w.id} className="workout-card glass-card">
                            <div className="card-header">
                                <div className="card-title-row">
                                    <span className="card-exercise">{w.exercise}</span>
                                    <span className={`sync-dot sync-${getSyncBadge(w)}`} />
                                </div>
                                <span className="card-date">{formatDate(w.date)}</span>
                            </div>

                            <div className="card-stats">
                                {strength && (
                                    <>
                                        {w.sets && (
                                            <div className="stat">
                                                <TrendingUp size={14} />
                                                <span>{w.sets}×{w.reps || '?'}</span>
                                            </div>
                                        )}
                                        {w.weight_kg && (
                                            <div className="stat">
                                                <Dumbbell size={14} />
                                                <span>{w.weight_kg} kg</span>
                                            </div>
                                        )}
                                    </>
                                )}
                                {cardio && (
                                    <>
                                        {w.duration_min && (
                                            <div className="stat">
                                                <Timer size={14} />
                                                <span>{w.duration_min} min</span>
                                            </div>
                                        )}
                                        {w.distance_km && (
                                            <div className="stat">
                                                <TrendingUp size={14} />
                                                <span>{w.distance_km} km</span>
                                            </div>
                                        )}
                                    </>
                                )}
                                {w.rpe && (
                                    <div className={`stat rpe rpe-${w.rpe <= 3 ? 'easy' : w.rpe <= 6 ? 'mod' : 'hard'}`}>
                                        RPE {w.rpe}
                                    </div>
                                )}
                            </div>

                            {w.notes && <p className="card-notes">{w.notes}</p>}

                            <div className="card-category">{w.category}</div>

                            <div className="card-actions">
                                <button
                                    className="btn-icon"
                                    onClick={() => navigate(`/workouts/new?edit=${w.id}`)}
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    className="btn-icon btn-danger"
                                    onClick={() => handleDelete(w.id, w.exercise)}
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WorkoutList;
