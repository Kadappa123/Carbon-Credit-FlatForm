import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CompanyDashboard from './pages/company/CompanyDashboard';
import SubmitEmission from './pages/company/SubmitEmission';
import Marketplace from './pages/company/Marketplace';
import MyTransactions from './pages/company/MyTransactions';
import RetireCredits from './pages/company/RetireCredits';
import CompanyProfile from './pages/company/CompanyProfile';
import GovernmentDashboard from './pages/government/GovernmentDashboard';
import ReviewSubmissions from './pages/government/ReviewSubmissions';
import ManageCompanies from './pages/government/ManageCompanies';
import FraudAlerts from './pages/government/FraudAlerts';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function PrivateRoute({ children, role }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
}

export default function App() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={
            isAuthenticated
              ? <Navigate to={user?.role === 'government' ? '/gov' : '/company'} />
              : <LoginPage />
          } />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={
            <div className="min-h-screen flex items-center justify-center text-red-600 text-xl">
              Access Denied
            </div>
          } />

          {/* Company Routes */}
          <Route path="/company" element={
            <PrivateRoute role="company"><CompanyDashboard /></PrivateRoute>
          } />
          <Route path="/company/emissions/submit" element={
            <PrivateRoute role="company"><SubmitEmission /></PrivateRoute>
          } />
          <Route path="/company/marketplace" element={
            <PrivateRoute role="company"><Marketplace /></PrivateRoute>
          } />
          <Route path="/company/transactions" element={
            <PrivateRoute role="company"><MyTransactions /></PrivateRoute>
          } />
          <Route path="/company/retire" element={
            <PrivateRoute role="company"><RetireCredits /></PrivateRoute>
          } />
          <Route path="/company/profile" element={
            <PrivateRoute role="company"><CompanyProfile /></PrivateRoute>
          } />

          {/* Government Routes */}
          <Route path="/gov" element={
            <PrivateRoute role="government"><GovernmentDashboard /></PrivateRoute>
          } />
          <Route path="/gov/submissions" element={
            <PrivateRoute role="government"><ReviewSubmissions /></PrivateRoute>
          } />
          <Route path="/gov/companies" element={
            <PrivateRoute role="government"><ManageCompanies /></PrivateRoute>
          } />
          <Route path="/gov/fraud" element={
            <PrivateRoute role="government"><FraudAlerts /></PrivateRoute>
          } />

          {/* Default */}
          <Route path="/" element={
            isAuthenticated
              ? <Navigate to={user?.role === 'government' ? '/gov' : '/company'} />
              : <Navigate to="/login" />
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
