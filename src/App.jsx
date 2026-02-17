import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Login from './components/auth/Login';
import WorkoutList from './components/workouts/WorkoutList';
import WorkoutForm from './components/workouts/WorkoutForm';
import TransactionList from './components/transactions/TransactionList';
import TransactionForm from './components/transactions/TransactionForm';
import OverviewDashboard from './components/dashboard/OverviewDashboard';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<OverviewDashboard />} />
        <Route path="/workouts" element={<WorkoutList />} />
        <Route path="/workouts/new" element={<WorkoutForm />} />
        <Route path="/expenses" element={<TransactionList />} />
        <Route path="/expenses/new" element={<TransactionForm />} />
      </Route>
    </Routes>
  );
}

export default App;
