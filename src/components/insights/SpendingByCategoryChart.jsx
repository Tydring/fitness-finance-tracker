import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="custom-tooltip">
            <div className="label">{label}</div>
            <div className="value">${payload[0].value.toFixed(2)}</div>
        </div>
    );
};

const BAR_COLOR = (name) =>
    name === 'Health & Fitness' ? '#818cf8' : '#ec4899';

const SpendingByCategoryChart = ({ data }) => (
    <div className="chart-card glass-card">
        <h3>Spending by Category</h3>
        <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} hide />
                <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {data.map((entry, i) => (
                        <Cell key={i} fill={BAR_COLOR(entry.name)} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
);

export default SpendingByCategoryChart;
