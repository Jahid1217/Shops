import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { AuthGuard, AdminGuard, MenuGuard } from './components/AuthGuard';
import Layout from './components/Layout';
import InstallPWAButton from './components/InstallPWAButton';

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
import Reports from './pages/Reports';

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
            <Route element={<Layout children={<Profile />} />} path="/profile" />

            <Route element={<MenuGuard menu="dashboard" />}>
              <Route element={<Layout children={<Dashboard />} />} path="/dashboard" />
            </Route>

            <Route element={<MenuGuard menu="inventory" />}>
              <Route element={<Layout children={<Inventory />} />} path="/inventory" />
            </Route>

            <Route element={<MenuGuard menu="pos" />}>
              <Route element={<Layout children={<POS />} />} path="/pos" />
            </Route>

            <Route element={<MenuGuard menu="customers" />}>
              <Route element={<Layout children={<Customers />} />} path="/customers" />
            </Route>

            <Route element={<MenuGuard menu="history" />}>
              <Route element={<Layout children={<History />} />} path="/history" />
            </Route>

            <Route element={<MenuGuard menu="reports" />}>
              <Route element={<Layout children={<Reports />} />} path="/reports" />
            </Route>
            
            <Route element={<MenuGuard menu="audit-logs" />}>
              <Route element={<Layout children={<AuditLogs />} />} path="/audit-logs" />
            </Route>

            {/* Admin Only Routes */}
            <Route element={<AdminGuard />}>
              <Route element={<Layout children={<Employees />} />} path="/employees" />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <InstallPWAButton />
      </Router>
    </AuthProvider>
  );
}
