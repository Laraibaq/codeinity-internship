import React, { useEffect, useState } from 'react';
import {
  Users,
  Car,
  Navigation,
  CreditCard,
  MessageSquare,
  Star,
  LifeBuoy,
  Wallet,
  TrendingUp,
  Calendar,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { apiFetch } from '../api/client';

export const DashboardView: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [range, setRange] = useState<'today' | '7d' | '30d' | 'custom'>('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    const [overviewRes, analyticsRes] = await Promise.all([
      apiFetch<any>('/admin/dashboard/overview'),
      apiFetch<any>(
        `/admin/dashboard/analytics?range=${range}${
          range === 'custom' && startDate && endDate
            ? `&startDate=${startDate}&endDate=${endDate}`
            : ''
        }`,
      ),
    ]);

    if (!overviewRes.ok) {
      setError(overviewRes.error || 'Failed to load dashboard overview');
      setIsLoading(false);
      return;
    }

    setOverview(overviewRes.data);
    if (analyticsRes.ok) {
      setAnalytics(analyticsRes.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  const handleCustomFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchData();
    }
  };

  if (isLoading && !overview) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ height: '40px', width: '200px' }} className="skeleton" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} style={{ height: '120px' }} className="skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <p style={{ color: '#ef4444', marginBottom: '16px', fontWeight: 600 }}>{error}</p>
        <button onClick={fetchData} className="btn btn-secondary">
          <RefreshCw size={16} /> Retry Fetching Metrics
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Date Filter & Actions Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: '#0f172a',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="#10b981" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>Analytics Period:</span>
          {(['today', '7d', '30d', 'custom'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={range === r ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            >
              {r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'Custom Range'}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <form onSubmit={handleCustomFilter} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <span style={{ color: '#64748b' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Apply
            </button>
          </form>
        )}

        <button onClick={fetchData} className="btn btn-secondary btn-sm" title="Refresh">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Card 1: Total Passengers */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                Passengers
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                {overview?.users?.totalPassengers ?? 0}
              </div>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '10px', borderRadius: '10px', color: '#3b82f6' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={14} />
            <span>+{overview?.users?.newPassengers24h ?? 0} in last 24h</span>
          </div>
        </div>

        {/* Card 2: Driver Fleet */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                Total Drivers
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                {overview?.drivers?.totalDrivers ?? 0}
              </div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '10px', color: '#10b981' }}>
              <Car size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', fontSize: '0.75rem' }}>
            <span style={{ color: '#10b981' }}>{overview?.drivers?.approvedDrivers ?? 0} Approved</span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#f59e0b' }}>{overview?.drivers?.pendingDrivers ?? 0} Pending</span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#ef4444' }}>{overview?.drivers?.suspendedDrivers ?? 0} Suspended</span>
          </div>
        </div>

        {/* Card 3: Rides Total */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                Total Rides
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                {overview?.rides?.totalRides ?? 0}
              </div>
            </div>
            <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '10px', borderRadius: '10px', color: '#8b5cf6' }}>
              <Navigation size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', fontSize: '0.75rem' }}>
            <span style={{ color: '#10b981' }}>{overview?.rides?.completedRides ?? 0} Completed</span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#3b82f6' }}>{overview?.rides?.ongoingRides ?? 0} Ongoing</span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#ef4444' }}>{overview?.rides?.cancelledRides ?? 0} Cancelled</span>
          </div>
        </div>

        {/* Card 4: Gross Payment Volume */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                Payment Volume
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                PKR {overview?.financial?.totalPaymentVolume?.toLocaleString() ?? 0}
              </div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '10px', color: '#10b981' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '12px' }}>
            Completed: PKR {overview?.financial?.completedPaymentVolume?.toLocaleString() ?? 0}
          </div>
        </div>
      </div>

      {/* Second Row Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '10px', color: '#f59e0b' }}>
            <Wallet size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Wallet Balances</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              PKR {overview?.financial?.totalWalletBalance?.toLocaleString() ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Across {overview?.financial?.totalWalletsCount ?? 0} wallets</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '12px', borderRadius: '10px', color: '#3b82f6' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Active Negotiations</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              {overview?.negotiations?.activeNegotiations ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Multi-turn sessions in progress</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(234, 179, 8, 0.15)', padding: '12px', borderRadius: '10px', color: '#eab308' }}>
            <Star size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Average System Rating</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              ★ {overview?.ratings?.averageRating ?? 0} / 5.0
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{overview?.ratings?.totalRatings ?? 0} total reviews</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '10px', color: '#ef4444' }}>
            <LifeBuoy size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Open Support Tickets</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              {overview?.support?.openTickets ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Awaiting resolution</div>
          </div>
        </div>
      </div>

      {/* Analytics Section: Daily Trends & Status Breakdowns */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          {/* Daily Activity Timeline */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#10b981" /> Daily Ride & Volume Trends
            </h3>
            {analytics.dailyTrends && analytics.dailyTrends.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Rides Created</th>
                      <th>Completed</th>
                      <th>Payment Vol. (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.dailyTrends.map((d: any) => (
                      <tr key={d.date}>
                        <td style={{ fontWeight: 500 }}>{d.date}</td>
                        <td>{d.rides}</td>
                        <td style={{ color: '#10b981' }}>{d.completedRides}</td>
                        <td style={{ fontWeight: 600 }}>PKR {d.revenuePKR.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No trend data for selected window.</p>
            )}
          </div>

          {/* Rides by Status Breakdown */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={18} color="#8b5cf6" /> Rides by Lifecycle Status
            </h3>
            {analytics.ridesByStatus && analytics.ridesByStatus.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analytics.ridesByStatus.map((s: any) => (
                  <div key={s.status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge badge-${s.status}`}>{s.status}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>{s.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No rides found for selected period.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
