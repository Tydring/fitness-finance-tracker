import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  if (val == null) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      <div className="value">RPE {val}</div>
    </div>
  );
};

const RPETrendChart = ({ data }) => (
  <div className="chart-card glass-card">
    <h3>Average RPE per Week</h3>
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={data}
        margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="week"
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[1, 10]}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          hide
        />
        <ReferenceLine
          y={5}
          stroke="rgba(255,255,255,0.1)"
          strokeDasharray="3 3"
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="rpe"
          stroke="#34d399"
          strokeWidth={2}
          dot={{ fill: "#34d399", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#34d399" }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default RPETrendChart;
