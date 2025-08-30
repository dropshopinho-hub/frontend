import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import ToolsPage from './components/ToolsPage';
import AssignmentsPage from './components/AssignmentsPage';
import MyToolsPage from './components/MyToolsPage';
import TransfersPage from './components/TransfersPage';
import ReturnsPage from './components/ReturnsPage';
import ReturnsTestPage from './components/ReturnsTestPage';
import ReportsPage from './components/ReportsPage';
import DashboardToolsStatus from './components/DashboardToolsStatus';
// import RejectedAssignmentsPage from './components/RejectedAssignmentsPage';
import './App.css';
import UserRegisterAdmin from './components/UserRegisterAdmin';
import UserAdminList from './components/UserAdminList';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('tools');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard-tools-status':
        return <DashboardToolsStatus />;
      case 'tools':
        return <ToolsPage />;
      case 'assignments':
        return <AssignmentsPage />;
      case 'my-tools':
        return <MyToolsPage />;
      case 'transfers':
        return <TransfersPage />;
      case 'returns':
        return <ReturnsPage />;
      case 'returns-test':
        return <TransfersPage />;
      case 'reports':
        return <ReportsPage />;
      case 'user-register':
        return <UserRegisterAdmin />;
      case 'user-admin-list':
        return <UserAdminList />;
      default:
        return <ToolsPage />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
