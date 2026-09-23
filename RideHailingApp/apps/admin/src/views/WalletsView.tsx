import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { apiFetch } from '../api/client';

export const WalletsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions'>('wallets');
  const [wallets, setWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchWallets = async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(roleFilter ? { userRole: roleFilter } : {}),
    });

    const res = await apiFetch<any>(`/admin/wallets?${query.toString()}`);
    if (res.ok && res.data) {
      setWallets(res.data.data);
      setTotal(res.data.total);
    }
    setIsLoading(false);
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const res = await apiFetch<any>(`/admin/wallet-transactions?${query.toString()}`);
    if (res.ok && res.data) {
      setTransactions(res.data.data);
      setTotal(res.data.total);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'wallets') {
      fetchWallets();
    } else {
      fetchTransactions();
    }
  }, [activeTab, page, roleFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Strict Read-Only Security Banner */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          padding: '14px 18px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Shield size={20} color="#3b82f6" />
        <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
          <strong style={{ color: '#f8fafc' }}>Cryptographic Financial Integrity Mode:</strong> Administrator wallet viewing is strictly read-only. Arbitrary balance overrides are disallowed to prevent ledger discrepancies and preserve double-entry reconciliation.
        </div>
      </div>

      {/* Tabs & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              setActiveTab('wallets');
              setPage(1);
            }}
            className={activeTab === 'wallets' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            User Wallets ({total})
          </button>
          <button
            onClick={() => {
              setActiveTab('transactions');
              setPage(1);
            }}
            className={activeTab === 'transactions' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Ledger Journal Entries
          </button>
        </div>

        {activeTab === 'wallets' && (
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Account Roles</option>
            <option value="passenger">Passengers</option>
            <option value="driver">Drivers</option>
          </select>
        )}
      </div>

      {/* Content Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          {activeTab === 'wallets' ? (
            <table>
              <thead>
                <tr>
                  <th>Wallet ID</th>
                  <th>Account Holder</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Current Balance</th>
                  <th>Currency</th>
                  <th>Last Transaction</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td colSpan={7} style={{ padding: '16px' }}>
                        <div className="skeleton" style={{ height: '24px', width: '100%' }} />
                      </td>
                    </tr>
                  ))
                ) : wallets.length > 0 ? (
                  wallets.map((w) => (
                    <tr key={w.id}>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {w.id.slice(0, 8)}...
                      </td>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>{w.userName}</td>
                      <td>
                        <span className="badge" style={{ background: w.userRole === 'driver' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: w.userRole === 'driver' ? '#10b981' : '#3b82f6' }}>
                          {w.userRole}
                        </span>
                      </td>
                      <td style={{ color: '#94a3b8' }}>{w.userPhone || '—'}</td>
                      <td style={{ fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>
                        PKR {w.balance?.toLocaleString()}
                      </td>
                      <td>{w.currency}</td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(w.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No wallet records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Entry ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Reference</th>
                  <th>Balance Before</th>
                  <th>Balance After</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td colSpan={7} style={{ padding: '16px' }}>
                        <div className="skeleton" style={{ height: '24px', width: '100%' }} />
                      </td>
                    </tr>
                  ))
                ) : transactions.length > 0 ? (
                  transactions.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {t.id.slice(0, 8)}...
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: t.type === 'credit' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: t.type === 'credit' ? '#10b981' : '#ef4444',
                          }}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: t.type === 'credit' ? '#10b981' : '#ef4444' }}>
                        {t.type === 'credit' ? '+' : '-'}PKR {t.amount}
                      </td>
                      <td style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                        {t.referenceType}
                      </td>
                      <td style={{ color: '#94a3b8' }}>PKR {t.balanceBefore}</td>
                      <td style={{ fontWeight: 600 }}>PKR {t.balanceAfter}</td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No ledger journal entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: '#0f172a',
            borderTop: '1px solid #1e293b',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Page {page} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
