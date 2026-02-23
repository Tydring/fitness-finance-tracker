import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const CustomTooltip = ({ active, payload, label, currency = "USD" }) => {
  if (!active || !payload?.length) return null;
  const symbol = currency === "VES" ? "Bs. " : "$";
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      <div className="value">
        {symbol}
        {payload[0].value.toLocaleString(
          currency === "VES" ? "es-VE" : "en-US",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        )}
      </div>
    </div>
  );
};

const SpendingTrendChart = ({ data, currency = "USD" }) => (
  <div className="chart-card glass-card">
    <h3>Daily Spending (30 days)</h3>
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={data}
        margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
      >
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="day"
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          hide
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#ec4899"
          fill="url(#spendGrad)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export default SpendingTrendChart;
