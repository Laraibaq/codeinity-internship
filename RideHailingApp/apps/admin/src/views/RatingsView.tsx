import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { apiFetch } from '../api/client';

export const RatingsView: React.FC = () => {
  const [ratings, setRatings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [scoreFilter, setScoreFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRatings = async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(scoreFilter ? { minScore: scoreFilter, maxScore: scoreFilter } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
    });

    const res = await apiFetch<any>(`/admin/ratings?${query.toString()}`);
    if (res.ok && res.data) {
      setRatings(res.data.data);
      setTotal(res.data.total);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRatings();
  }, [page, scoreFilter, roleFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Ratings & Reviews Moderation</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{total} total reviews submitted</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={scoreFilter}
            onChange={(e) => {
              setScoreFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Star Ratings</option>
            <option value="5">5 Stars (Excellent)</option>
            <option value="4">4 Stars (Good)</option>
            <option value="3">3 Stars (Average)</option>
            <option value="2">2 Stars (Poor)</option>
            <option value="1">1 Star (Very Poor)</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Reviewer Roles</option>
            <option value="passenger">From Passengers</option>
            <option value="driver">From Drivers</option>
          </select>
        </div>
      </div>

      {/* Ratings Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rating</th>
                <th>Reviewer Role</th>
                <th>Participants (Passenger / Driver)</th>
                <th>Review Comment</th>
                <th>Route</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} style={{ padding: '16px' }}>
                      <div className="skeleton" style={{ height: '24px', width: '100%' }} />
                    </td>
                  </tr>
                ))
              ) : ratings.length > 0 ? (
                ratings.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            color={i < r.score ? '#eab308' : '#334155'}
                            fill={i < r.score ? '#eab308' : 'transparent'}
                          />
                        ))}
                        <span style={{ fontWeight: 700, marginLeft: '4px' }}>{r.score}.0</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#1e293b', color: '#cbd5e1' }}>
                        {r.fromRole}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>{r.ride?.passenger?.name || 'Passenger'}</div>
                      <div style={{ color: '#64748b' }}>with {r.ride?.driver?.name || 'Driver'}</div>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      {r.comment ? (
                        <span style={{ fontStyle: 'italic', color: '#e2e8f0' }}>"{r.comment}"</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>No written feedback</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '220px' }}>
                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {r.ride?.pickupAddress || '—'}
                      </div>
                      <div style={{ color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        ➔ {r.ride?.dropoffAddress || '—'}
                      </div>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No reviews matching query.
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
