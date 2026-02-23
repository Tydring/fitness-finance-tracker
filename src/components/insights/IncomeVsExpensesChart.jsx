import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload, label, currency = "USD" }) => {
  if (!active || !payload?.length) return null;
  const symbol = currency === "VES" ? "Bs. " : "$";
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p) => (
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

const IncomeVsExpensesChart = ({ data, currency = "USD" }) => (
  <div className="chart-card glass-card">
    <h3>Income vs Expenses</h3>
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
        barGap={2}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
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
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Legend
          wrapperStyle={{
            fontSize: "12px",
            color: "#94a3b8",
            paddingTop: "8px",
          }}
          formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
        />
        <Bar
          dataKey="income"
          name="income"
          fill="#10b981"
          radius={[3, 3, 0, 0]}
        />
        <Bar
          dataKey="expenses"
          name="expenses"
          fill="#ec4899"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default IncomeVsExpensesChart;
