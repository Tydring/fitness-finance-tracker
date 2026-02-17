const OverviewDashboard = () => {
    return (
        <div className="page-container">
            <h2 className="mb-4">Dashboard</h2>
            <div className="grid gap-4">
                <div className="p-4 glass-card">
                    <h3 className="text-lg text-indigo-400">Fitness</h3>
                    <p className="text-2xl font-bold">0 Workouts</p>
                    <p className="text-sm text-slate-400">This week</p>
                </div>
                <div className="p-4 glass-card">
                    <h3 className="text-lg text-pink-400">Finance</h3>
                    <p className="text-2xl font-bold">$0.00</p>
                    <p className="text-sm text-slate-400">This month</p>
                </div>
            </div>
        </div>
    );
};

export default OverviewDashboard;
