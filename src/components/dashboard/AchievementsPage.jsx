import { useNavigate } from "react-router-dom";
import { useUserStats } from "../../context/UserStatsContext";
import { ArrowLeft, Award, Flame, Snowflake, Trophy, Crown, Shield, Zap, Rocket, Sun, Moon, Timer, Dumbbell, Activity, Heart, Wind, Target, Anvil, Layers, Globe } from "lucide-react";
import "./AchievementsPage.css";

const AchievementsPage = () => {
    const navigate = useNavigate();
    const { stats, loading, BADGES } = useUserStats();

    if (loading) {
        return (
            <div className="page-container">
                <h2 className="dashboard-title">Achievements</h2>
                <div className="loading-text">Loading stats...</div>
            </div>
        );
    }

    // Pre-define all possible badges and their states
    const ALL_BADGES = [
        // Milestones
        { id: BADGES?.FIRST_STEP, title: "First Step", desc: "Log your first workout.", icon: <Award /> },
        { id: BADGES?.CONSISTENCY, title: "Consistency Is Key", desc: "Log 10 total lifetime workouts.", icon: <Target /> },
        { id: BADGES?.CENTURY_CLUB, title: "Century Club", desc: "Log 100 total lifetime workouts.", icon: <Crown /> },
        { id: BADGES?.SPARTAN, title: "Spartan", desc: "Log 300 total lifetime workouts.", icon: <Shield /> },

        // Streaks
        { id: BADGES?.HAT_TRICK, title: "Hat Trick", desc: "Maintain a 3-day streak.", icon: <Flame /> },
        { id: BADGES?.WEEK_1, title: "Week 1", desc: "Maintain a 7-day streak.", icon: <Trophy /> },
        { id: BADGES?.ON_FIRE, title: "On Fire", desc: "Maintain a 14-day streak.", icon: <Zap /> },
        { id: BADGES?.UNSTOPPABLE, title: "Unstoppable", desc: "Maintain a 30-day streak.", icon: <Rocket /> },

        // Session Extras
        { id: BADGES?.HEAVYWEIGHT, title: "Heavyweight", desc: "Log an exercise with 100+ kg.", icon: <Anvil /> },
        { id: BADGES?.VOLUME_WARNING, title: "Volume Warning", desc: "Log 15+ sets in a single session.", icon: <Layers /> },
        { id: BADGES?.QUICK_BURN, title: "Quick Burn", desc: "Session under 20 mins total.", icon: <Flame /> },
        { id: BADGES?.FULL_BODY, title: "Full Body Pattern", desc: "Log 3+ unique categories at once.", icon: <Globe /> },

        // Vibes
        { id: BADGES?.EARLY_BIRD, title: "Early Bird", desc: "Log a workout between 4 AM - 7 AM.", icon: <Sun /> },
        { id: BADGES?.NIGHT_OWL, title: "Night Owl", desc: "Log a workout between 10 PM - 2 AM.", icon: <Moon /> },
        { id: BADGES?.MARATHON_SESSION, title: "Marathon Session", desc: "Log a single exercise lasting over 90 mins.", icon: <Timer /> },

        // Identity
        { id: BADGES?.CENTURION, title: "Centurion", desc: "Log 100 Strength exercises.", icon: <Dumbbell /> },
        { id: BADGES?.IRON_CORE, title: "Iron Core", desc: "Log 50 Core exercises.", icon: <Activity /> },
        { id: BADGES?.YOGI, title: "Yogi", desc: "Log 50 Flexibility exercises.", icon: <Heart /> },
        { id: BADGES?.CARDIO_JUNKIE, title: "Cardio Junkie", desc: "Log 50 Cardio exercises.", icon: <Wind /> },
    ];

    const earnedBadges = stats?.badges || [];

    return (
        <div className="page-container">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h2 className="dashboard-title">Achievements</h2>
            </div>

            <div className="stats-overview">
                <div className="stat-card">
                    <Flame className="stat-icon flame" size={32} />
                    <div className="stat-info">
                        <span className="stat-val">{stats?.currentStreak || 0}</span>
                        <span className="stat-name">Current Streak</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Trophy className="stat-icon trophy" size={32} />
                    <div className="stat-info">
                        <span className="stat-val">{stats?.longestStreak || 0}</span>
                        <span className="stat-name">Longest Streak</span>
                    </div>
                </div>
            </div>

            <div className="badges-grid">
                {ALL_BADGES.map((badge) => {
                    const isEarned = earnedBadges.includes(badge.id);
                    return (
                        <div key={badge.id} className={`badge-card ${isEarned ? 'earned' : 'locked'}`}>
                            <div className="badge-icon-wrapper">
                                {badge.icon}
                            </div>
                            <h3 className="badge-title">{badge.title}</h3>
                            <p className="badge-desc">{badge.desc}</p>
                            {!isEarned && <div className="locked-overlay">Locked</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AchievementsPage;
