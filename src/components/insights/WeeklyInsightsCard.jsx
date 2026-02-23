import {
  Dumbbell,
  Wallet,
  Sparkles,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import "./WeeklyInsightsCard.css";

function formatWeekKey(weekKey) {
  if (!weekKey) return "";
  // '2026-W07' → 'Week 7, 2026'
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekKey;
  return `Week ${parseInt(match[2], 10)}, ${match[1]}`;
}

function formatTimestamp(ts) {
  if (!ts) return null;
  const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function InsightSection({ icon: Icon, title, accentClass, section }) {
  if (!section) return null;
  return (
    <div className="insight-section">
      <div className={`insight-section-header ${accentClass}`}>
        <Icon size={15} />
        <span>{title}</span>
      </div>
      {section.summary && <p className="insight-summary">{section.summary}</p>}
      {section.highlights?.length > 0 && (
        <ul className="insight-highlights">
          {section.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}
      {section.suggestion && (
        <div className="insight-suggestion">
          <Lightbulb size={13} />
          <span>{section.suggestion}</span>
        </div>
      )}
    </div>
  );
}

const WeeklyInsightsCard = ({ insights }) => {
  if (!insights) return null;

  return (
    <div className="weekly-insights glass-card">
      <div className="insights-card-header">
        <div className="insights-card-title">
          <Sparkles size={16} className="sparkle-icon" />
          <span>AI Weekly Review</span>
        </div>
        <div className="insights-card-meta">
          <span className="insights-week-key">
            {formatWeekKey(insights.week_key)}
          </span>
          {insights.generated_at && (
            <span className="insights-generated">
              {formatTimestamp(insights.generated_at)}
            </span>
          )}
        </div>
      </div>

      <InsightSection
        icon={Dumbbell}
        title="Fitness"
        accentClass="accent-indigo"
        section={insights.fitness}
      />

      <InsightSection
        icon={Wallet}
        title="Finance"
        accentClass="accent-pink"
        section={insights.finance}
      />

      {insights.combined && (
        <div className="insight-combined">
          <TrendingUp size={13} />
          <span>{insights.combined}</span>
        </div>
      )}

      <div className="insights-model-badge">
        Powered by {insights.model ?? "Claude"}
      </div>
    </div>
  );
};

export default WeeklyInsightsCard;
