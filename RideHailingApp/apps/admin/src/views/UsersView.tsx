import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Eye, X, Star, Calendar, Phone, Mail } from 'lucide-react';
import { apiFetch } from '../api/client';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {}),
    });

    const res = await apiFetch<any>(`/admin/users?${query.toString()}`);
    if (res.ok && res.data) {
      setUsers(res.data.data);
      setTotal(res.data.total);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const viewDetails = async (id: string) => {
    setIsDetailLoading(true);
    setSelectedUser(null);
    const res = await apiFetch<any>(`/admin/users/${id}`);
    if (res.ok && res.data) {
      setSelectedUser(res.data);
    }
    setIsDetailLoading(false);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Passengers Directory</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{total} total registered passenger accounts</p>
        </div>

        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: '100%', paddingLeft: '38px' }}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Passenger</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Phone Verified</th>
                <th>Rating</th>
                <th>Rides</th>
                <th>Registered</th>
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
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{u.name}</td>
                    <td>{u.phone}</td>
                    <td style={{ color: '#94a3b8' }}>{u.email || '—'}</td>
                    <td>
                      {u.phoneVerified ? (
                        <span className="badge badge-approved">VERIFIED</span>
                      ) : (
                        <span className="badge badge-pending">UNVERIFIED</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} color="#eab308" fill="#eab308" />
                        <span>{u.rating ? u.rating.toFixed(1) : 'New'}</span>
                      </div>
                    </td>
                    <td>{u.rideCount}</td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => viewDetails(u.id)} className="btn btn-secondary btn-sm">
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No passengers matched your query.
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

      {/* User Details Modal */}
      {(selectedUser || isDetailLoading) && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Passenger Profile & Activity</h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {isDetailLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="skeleton" style={{ height: '60px' }} />
                <div className="skeleton" style={{ height: '140px' }} />
              </div>
            ) : selectedUser ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Profile Header */}
                <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc' }}>
                    {selectedUser.profile.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '10px', fontSize: '0.875rem', color: '#94a3b8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} /> {selectedUser.profile.phone}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} /> {selectedUser.profile.email || 'No email provided'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> Joined {new Date(selectedUser.profile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Wallet Balance */}
                {selectedUser.wallet && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '14px 18px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>WALLET BALANCE</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                        PKR {selectedUser.wallet.balance.toLocaleString()}
                      </div>
                    </div>
                    <span className="badge badge-approved">ACTIVE WALLET</span>
                  </div>
                )}

                {/* Rides Summary */}
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Rides Breakdown</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedUser.ridesSummary.map((r: any) => (
                      <span key={r.status} className={`badge badge-${r.status}`}>
                        {r.status}: {r.count}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recent Rides */}
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Recent Rides</h4>
                  {selectedUser.recentRides.length > 0 ? (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Pickup / Dropoff</th>
                            <th>Fare</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedUser.recentRides.map((r: any) => (
                            <tr key={r.id}>
                              <td style={{ fontSize: '0.8rem' }}>
                                <div>{r.pickupAddress}</div>
                                <div style={{ color: '#64748b' }}>↳ {r.dropoffAddress}</div>
                              </td>
                              <td style={{ fontWeight: 600 }}>PKR {r.finalFare || r.proposedFare}</td>
                              <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                              <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{new Date(r.requestedAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>No recorded rides.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
