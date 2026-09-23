import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout, type TabType } from './components/Layout';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { UsersView } from './views/UsersView';
import { DriversView } from './views/DriversView';
import { RidesView } from './views/RidesView';
import { NegotiationsView } from './views/NegotiationsView';
import { PaymentsView } from './views/PaymentsView';
import { WalletsView } from './views/WalletsView';
import { RatingsView } from './views/RatingsView';
import { SupportView } from './views/SupportView';
import { AuditLogsView } from './views/AuditLogsView';

const AdminAppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0f19',
          color: '#10b981',
          fontSize: '1.25rem',
          fontWeight: 600,
        }}
      >
        Initializing Secure Admin Console...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <Layout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === 'dashboard' && <DashboardView />}
      {currentTab === 'users' && <UsersView />}
      {currentTab === 'drivers' && <DriversView />}
      {currentTab === 'rides' && <RidesView />}
      {currentTab === 'negotiations' && <NegotiationsView />}
      {currentTab === 'payments' && <PaymentsView />}
      {currentTab === 'wallets' && <WalletsView />}
      {currentTab === 'ratings' && <RatingsView />}
      {currentTab === 'support' && <SupportView />}
      {currentTab === 'audit-logs' && <AuditLogsView />}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AdminAppContent />
    </AuthProvider>
  );
}
