import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{payload[0].name}</div>
      <div className="value">{payload[0].value} workouts</div>
    </div>
  );
};

const CategoryBreakdownChart = ({ data }) => (
  <div className="chart-card glass-card">
    <h3>Workout Categories</h3>
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={75}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          stroke="none"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default CategoryBreakdownChart;
