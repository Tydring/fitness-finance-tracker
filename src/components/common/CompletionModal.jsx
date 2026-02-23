import { X, Flame, Award, Snowflake } from 'lucide-react';
import './CompletionModal.css';

const CompletionModal = ({ result, onClose }) => {
    if (!result) return null;

    const { stats, newBadges } = result;

    return (
        <div className="modal-overlay">
            <div className="completion-modal animate-pop-in">
                <button className="close-btn" onClick={onClose} aria-label="Close modal">
                    <X size={24} />
                </button>

                <h2 className="celebration-title">Workout Complete! 🎉</h2>

                <div className="stats-row">
                    <div className="stat-box">
                        <Flame className="stat-icon flame" />
                        <span className="stat-value">{stats.currentStreak} Day{stats.currentStreak !== 1 ? 's' : ''}</span>
                        <span className="stat-label">Current Streak</span>
                    </div>
                    {stats.freezeActive && (
                        <div className="stat-box freeze">
                            <Snowflake className="stat-icon ice" />
                            <span className="stat-value">Freeze Used</span>
                            <span className="stat-label">Streak Saved!</span>
                        </div>
                    )}
                </div>

                {newBadges && newBadges.length > 0 && (
                    <div className="badges-section">
                        <h3>New Badges Unlocked! 🏆</h3>
                        <div className="badges-list">
                            {newBadges.map((badge, idx) => (
                                <div
                                    key={badge}
                                    className="badge-item animate-bounce-in"
                                    style={{ animationDelay: `${0.3 + (idx * 0.15)}s` }}
                                >
                                    <Award className="badge-icon" size={20} />
                                    <span>{badge}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button className="btn btn-primary continue-btn" onClick={onClose}>
                    Continue to Dashboard
                </button>
            </div>
        </div>
    );
};

export default CompletionModal;
