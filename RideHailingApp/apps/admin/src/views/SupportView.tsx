import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../api/client';

export const SupportView: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(categoryFilter ? { category: categoryFilter } : {}),
    });

    const res = await apiFetch<any>(`/admin/support-tickets?${query.toString()}`);
    if (res.ok && res.data) {
      setTickets(res.data.data);
      setTotal(res.data.total);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, categoryFilter]);

  const toggleStatus = async (ticket: any) => {
    setUpdatingId(ticket.id);
    const newStatus = ticket.status === 'open' ? 'resolved' : 'open';

    const res = await apiFetch<any>(`/admin/support-tickets/${ticket.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });

    setUpdatingId(null);
    if (res.ok) {
      fetchTickets();
    } else {
      alert(res.error || 'Failed to update ticket status');
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Driver Support Ticket Queue</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{total} total support requests filed</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            <option value="ride">Ride Issues</option>
            <option value="account">Account</option>
            <option value="vehicle_document">Documents</option>
            <option value="technical">Technical</option>
            <option value="safety">Safety</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Driver</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Action</th>
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
              ) : tickets.length > 0 ? (
                tickets.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {t.id.slice(0, 8)}...
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.driver?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.driver?.phone}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#1e293b', color: '#cbd5e1' }}>
                        {t.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{t.subject}</td>
                    <td style={{ fontSize: '0.85rem', color: '#cbd5e1', maxWidth: '300px' }}>
                      {t.description}
                    </td>
                    <td>
                      <span className={`badge badge-${t.status}`}>{t.status}</span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => toggleStatus(t)}
                        disabled={updatingId === t.id}
                        className={t.status === 'open' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                      >
                        {updatingId === t.id
                          ? 'Updating...'
                          : t.status === 'open'
                          ? 'Mark Resolved'
                          : 'Reopen'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No support tickets found.
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
