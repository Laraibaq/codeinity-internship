import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../api/client';

export const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [financial, setFinancial] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(methodFilter ? { paymentMethod: methodFilter } : {}),
    });

    const [paymentsRes, finRes] = await Promise.all([
      apiFetch<any>(`/admin/payments?${query.toString()}`),
      apiFetch<any>('/admin/financial/overview?range=30d'),
    ]);

    if (paymentsRes.ok && paymentsRes.data) {
      setPayments(paymentsRes.data.data);
      setTotal(paymentsRes.data.total);
    }
    if (finRes.ok && finRes.data) {
      setFinancial(finRes.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, [page, search, statusFilter, methodFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Financial KPIs Banner */}
      {financial && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>GROSS RIDE VALUE (30D)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
              PKR {financial.grossRideValue?.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
              {financial.totalTransactions} recorded transactions
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>COMPLETED PAYMENT VOLUME</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
              PKR {financial.completedPaymentVolume?.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
              {financial.completedTransactions} settled
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>PENDING VOLUME</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
              PKR {financial.pendingPaymentVolume?.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>In flight / pending cash verification</div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>REFUNDED AMOUNT</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>
              PKR {financial.refundedAmount?.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>Direct wallet & card reversions</div>
          </div>
        </div>
      )}

      {/* Header, Filters & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Payment Ledger Transactions</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{total} transactions in ledger</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Payment Statuses</option>
            <option value="succeeded">Succeeded</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="wallet">Wallet</option>
            <option value="card">Card</option>
          </select>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search payment or ride ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ width: '100%', paddingLeft: '38px' }}
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Ride Route</th>
                <th>Passenger</th>
                <th>Driver</th>
                <th>Amount (PKR)</th>
                <th>Method</th>
                <th>Status</th>
                <th>Refunded</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan={9} style={{ padding: '16px' }}>
                      <div className="skeleton" style={{ height: '24px', width: '100%' }} />
                    </td>
                  </tr>
                ))
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {p.id.slice(0, 8)}...
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '200px' }}>
                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {p.ride?.pickupAddress || 'Ride: ' + p.rideId.slice(0, 8)}
                      </div>
                      <div style={{ color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        ➔ {p.ride?.dropoffAddress || ''}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.ride?.passenger?.name || '—'}</td>
                    <td>{p.ride?.driver?.name || '—'}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>
                      PKR {p.amount}
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#1e293b', color: '#cbd5e1' }}>
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${p.status}`}>{p.status}</span>
                    </td>
                    <td style={{ color: p.refundedAmount > 0 ? '#ef4444' : '#64748b' }}>
                      {p.refundedAmount > 0 ? `PKR ${p.refundedAmount}` : '—'}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
