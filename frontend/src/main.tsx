import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AgentDashboard } from './pages/AgentDashboard';
import { CustomerFormPage } from './pages/CustomerFormPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/login" element={<LoginPage role="admin" />} />
          <Route path="/agent/login" element={<LoginPage role="agent" />} />

          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route element={<ProtectedRoute role="agent" />}>
            <Route path="/agent" element={<AgentDashboard />} />
            <Route path="/agent/customers/new" element={<CustomerFormPage />} />
            <Route path="/agent/customers/:id" element={<CustomerDetailPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
