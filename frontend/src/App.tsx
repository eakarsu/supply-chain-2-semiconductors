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
import EccnClassifier from './pages/EccnClassifier';
import SupplierGraph from './pages/SupplierGraph';
import CowosCapacity from './pages/CowosCapacity';
import HbmBookings from './pages/HbmBookings';
import CustomViewsPage from './pages/CustomViewsPage';
import OsatSlotReservation from './pages/OsatSlotReservation';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

import GapCowosTracker from './pages/GapCowosTracker';
import GapHbmBookingMonitor from './pages/GapHbmBookingMonitor';
import GapEarEccnClassifier from './pages/GapEarEccnClassifier';
import GapTierNDiscovery from './pages/GapTierNDiscovery';
import GapWaferYieldMl from './pages/GapWaferYieldMl';
import GapEdiSapConnector from './pages/GapEdiSapConnector';
import GapRealtimeAllocation from './pages/GapRealtimeAllocation';
import GapHtsEccnLookup from './pages/GapHtsEccnLookup';
import GapFactoryWeatherFeed from './pages/GapFactoryWeatherFeed';
import GapPoGeneration from './pages/GapPoGeneration';
import GapMultipartyDataroom from './pages/GapMultipartyDataroom';
import CfTierNGraph from './pages/CfTierNGraph';
import CfCowosCalendar from './pages/CfCowosCalendar';
import CfEccnLiveUpdate from './pages/CfEccnLiveUpdate';
import CfDisasterRiskOverlay from './pages/CfDisasterRiskOverlay';
import CfAutoReshuffleAgent from './pages/CfAutoReshuffleAgent';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

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
          <Route path="eccn-classifier" element={<EccnClassifier />} />
          <Route path="supplier-graph" element={<SupplierGraph />} />
          <Route path="cowos-capacity" element={<CowosCapacity />} />
          <Route path="hbm-bookings" element={<HbmBookings />} />
          <Route path="custom-views" element={<CustomViewsPage />} />
          <Route path="osat-slot-reservation" element={<OsatSlotReservation />} />
          <Route path="gap/cowos-tracker" element={<GapCowosTracker />} />
          <Route path="gap/hbm-booking-monitor" element={<GapHbmBookingMonitor />} />
          <Route path="gap/ear-eccn-classifier" element={<GapEarEccnClassifier />} />
          <Route path="gap/tier-n-discovery" element={<GapTierNDiscovery />} />
          <Route path="gap/wafer-yield-ml" element={<GapWaferYieldMl />} />
          <Route path="gap/edi-sap-connector" element={<GapEdiSapConnector />} />
          <Route path="gap/realtime-allocation" element={<GapRealtimeAllocation />} />
          <Route path="gap/hts-eccn-lookup" element={<GapHtsEccnLookup />} />
          <Route path="gap/factory-weather-feed" element={<GapFactoryWeatherFeed />} />
          <Route path="gap/po-generation" element={<GapPoGeneration />} />
          <Route path="gap/multiparty-dataroom" element={<GapMultipartyDataroom />} />
          <Route path="cf/tier-n-graph" element={<CfTierNGraph />} />
          <Route path="cf/cowos-calendar" element={<CfCowosCalendar />} />
          <Route path="cf/eccn-live-update" element={<CfEccnLiveUpdate />} />
          <Route path="cf/disaster-risk-overlay" element={<CfDisasterRiskOverlay />} />
          <Route path="cf/auto-reshuffle-agent" element={<CfAutoReshuffleAgent />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
