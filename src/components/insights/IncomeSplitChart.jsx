import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";

const CustomTooltip = ({ active, payload, label, currency = "USD" }) => {
  if (!active || !payload?.length) return null;
  const symbol = currency === "VES" ? "Bs. " : "$";

  // Sort descending by value so largest contributors are at the top of the tooltip
  const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {sortedPayload.map((p) => (
        <div key={p.dataKey} className="value" style={{ color: p.color }}>
          {p.name}: {symbol}
          {p.value.toLocaleString(currency === "VES" ? "es-VE" : "en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ))}
    </div>
  );
};

const IncomeSplitChart = ({ data, currency = "USD" }) => {
  if (!data || data.length === 0) return null;

  // Extract unique keys (income sources) dynamically to generate the <Bar> components
  const keys = new Set();
  data.forEach((d) => {
    Object.keys(d).forEach((k) => {
      if (k !== "month") keys.add(k);
    });
  });

  const incomeSources = Array.from(keys);

  const CATEGORY_COLORS = [
    "#10b981",
    "#34d399",
    "#6ee7b7",
    "#059669",
    "#047857",
    "#a7f3d0",
  ];

  return (
    <div className="chart-card glass-card" style={{ gridColumn: "1 / -1" }}>
      <h3>Income Split streams</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis
            dataKey="month"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            hide
          />
          <Tooltip
            content={<CustomTooltip currency={currency} />}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              color: "#94a3b8",
              paddingTop: "8px",
            }}
          />

          {incomeSources.map((source, i) => (
            <Bar
              key={source}
              dataKey={source}
              stackId="a"
              fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeSplitChart;
