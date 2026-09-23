import React from 'react';
import {
  BarChart3,
  Users,
  Car,
  Navigation,
  MessageSquare,
  CreditCard,
  Wallet,
  Star,
  LifeBuoy,
  ShieldAlert,
  LogOut,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type TabType =
  | 'dashboard'
  | 'users'
  | 'drivers'
  | 'rides'
  | 'negotiations'
  | 'payments'
  | 'wallets'
  | 'ratings'
  | 'support'
  | 'audit-logs';

interface LayoutProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, onSelectTab, children }) => {
  const { admin, logout } = useAuth();

  const navItems: { id: TabType; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Overview & Analytics', icon: BarChart3 },
    { id: 'users', label: 'Passengers', icon: Users },
    { id: 'drivers', label: 'Drivers & Fleet', icon: Car },
    { id: 'rides', label: 'Ride Operations', icon: Navigation },
    { id: 'negotiations', label: 'Negotiations', icon: MessageSquare },
    { id: 'payments', label: 'Financial & Payments', icon: CreditCard },
    { id: 'wallets', label: 'Wallets & Ledger', icon: Wallet },
    { id: 'ratings', label: 'Ratings & Reviews', icon: Star },
    { id: 'support', label: 'Support Queue', icon: LifeBuoy },
    { id: 'audit-logs', label: 'Audit Trail', icon: ShieldAlert },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0f19' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          background: '#0f172a',
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#042f2e',
              fontWeight: 'bold',
              fontSize: '1.25rem',
            }}
          >
            R
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#f8fafc' }}>
              RideHailing
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
              ADMIN CONSOLE
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: active ? '#1e293b' : 'transparent',
                  color: active ? '#10b981' : '#94a3b8',
                  fontWeight: active ? 600 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  borderLeft: active ? '3px solid #10b981' : '3px solid transparent',
                }}
              >
                <Icon size={18} color={active ? '#10b981' : '#64748b'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Admin footer */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #1e293b',
            background: '#0b0f19',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {admin?.name || 'Administrator'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {admin?.email}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        {/* Top Header */}
        <header
          style={{
            height: '64px',
            background: '#0f172a',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              {navItems.find((n) => n.id === currentTab)?.label}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#131c2e',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid #1e293b',
                fontSize: '0.75rem',
                color: '#10b981',
              }}
            >
              <Radio size={12} className="animate-pulse" />
              <span>LIVE SERVER (PORT 3000)</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              ROLE: {admin?.role?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div style={{ padding: '32px', flex: 1 }}>{children}</div>
      </main>
    </div>
  );
};
