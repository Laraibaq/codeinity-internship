import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
import { apiFetch } from '../api/client';

export const NegotiationsView: React.FC = () => {
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNego, setSelectedNego] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchNegotiations = async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });

    const res = await apiFetch<any>(`/admin/negotiations?${query.toString()}`);
    if (res.ok && res.data) {
      setNegotiations(res.data.data);
      setTotal(res.data.total);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNegotiations();
  }, [page, search, statusFilter]);

  const viewDetails = async (id: string) => {
    setIsDetailLoading(true);
    setSelectedNego(null);
    const res = await apiFetch<any>(`/admin/negotiations/${id}`);
    if (res.ok && res.data) {
      setSelectedNego(res.data);
    }
    setIsDetailLoading(false);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header, Filters & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Fare Negotiation Inspector</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{total} total multi-turn negotiation sessions</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Negotiation Statuses</option>
            <option value="active">Active</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search ride ID or user..."
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

      {/* Negotiations Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Passenger</th>
                <th>Driver</th>
                <th>Current Amount</th>
                <th>Rounds</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan={8} style={{ padding: '16px' }}>
                      <div className="skeleton" style={{ height: '24px', width: '100%' }} />
                    </td>
                  </tr>
                ))
              ) : negotiations.length > 0 ? (
                negotiations.map((n) => (
                  <tr key={n.id}>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {n.id.slice(0, 8)}...
                    </td>
                    <td style={{ fontWeight: 600 }}>{n.passenger?.name || '—'}</td>
                    <td>{n.driver?.name || '—'}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>
                      PKR {n.currentAmount}
                    </td>
                    <td>{n.roundsCount} turns</td>
                    <td>
                      <span className={`badge badge-${n.status}`}>{n.status}</span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(n.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => viewDetails(n.id)} className="btn btn-secondary btn-sm">
                        <Eye size={14} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No negotiations found.
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

      {/* Negotiation Round-by-Round Modal */}
      {(selectedNego || isDetailLoading) && (
        <div className="modal-overlay" onClick={() => setSelectedNego(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Negotiation Rounds & Timeline</h3>
              <button onClick={() => setSelectedNego(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {isDetailLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="skeleton" style={{ height: '60px' }} />
                <div className="skeleton" style={{ height: '140px' }} />
              </div>
            ) : selectedNego ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Status Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>FINAL COMMITTED FARE</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>
                      PKR {selectedNego.currentAmount}
                    </div>
                  </div>
                  <span className={`badge badge-${selectedNego.status}`}>{selectedNego.status}</span>
                </div>

                {/* Offer Rounds */}
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '12px' }}>
                    Multi-Turn Offer Audit Trail ({selectedNego.offers?.length || 0} rounds)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedNego.offers && selectedNego.offers.length > 0 ? (
                      selectedNego.offers.map((o: any, idx: number) => {
                        const isPassenger = o.proposerId === selectedNego.passengerId;
                        return (
                          <div
                            key={o.id}
                            style={{
                              padding: '12px 16px',
                              background: '#0f172a',
                              border: '1px solid #1e293b',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>#{idx + 1}</span>
                                <span style={{ fontWeight: 600, color: isPassenger ? '#3b82f6' : '#10b981', fontSize: '0.85rem' }}>
                                  {isPassenger ? 'Passenger Proposal' : 'Driver Counteroffer'}
                                </span>
                                <span className={`badge badge-${o.status}`} style={{ fontSize: '0.65rem' }}>{o.status}</span>
                              </div>
                              {o.reason && (
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                                  Reason: "{o.reason}"
                                </div>
                              )}
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                {new Date(o.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                              PKR {o.amount}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No offers recorded in session.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
