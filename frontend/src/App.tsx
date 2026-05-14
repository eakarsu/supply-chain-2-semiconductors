import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import SuppliersPage from './pages/SuppliersPage';
import ComponentsPage from './pages/ComponentsPage';
import AllocationsPage from './pages/AllocationsPage';
import RiskAlertsPage from './pages/RiskAlertsPage';
import FabsPage from './pages/FabsPage';
import IntelligencePage from './pages/IntelligencePage';
import ExportPage from './pages/ExportPage';
import SearchPage from './pages/SearchPage';
import AuditLogPage from './pages/AuditLogPage';
import SampleDataPage from './pages/SampleDataPage';
import Dashboard from './pages/Dashboard';
import AICenter from './components/AICenter';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="components" element={<ComponentsPage />} />
          <Route path="allocations" element={<AllocationsPage />} />
          <Route path="risk-alerts" element={<RiskAlertsPage />} />
          <Route path="fabs" element={<FabsPage />} />
          <Route path="intelligence" element={<IntelligencePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="sample-data" element={<SampleDataPage />} />
          <Route path="ai-center" element={<AICenter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
