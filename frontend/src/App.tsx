import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { AuthGuard, AdminGuard } from './components/AuthGuard';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import AuditLogs from './pages/AuditLogs';
import History from './pages/History';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route element={<AuthGuard />}>
            <Route element={<Layout children={<Dashboard />} />} path="/dashboard" />
            <Route element={<Layout children={<Inventory />} />} path="/inventory" />
            <Route element={<Layout children={<POS />} />} path="/pos" />
            <Route element={<Layout children={<Customers />} />} path="/customers" />
            <Route element={<Layout children={<History />} />} path="/history" />
            <Route element={<Layout children={<Profile />} />} path="/profile" />
            
            {/* Admin Only Routes */}
            <Route element={<AdminGuard />}>
              <Route element={<Layout children={<Employees />} />} path="/employees" />
              <Route element={<Layout children={<AuditLogs />} />} path="/audit-logs" />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
