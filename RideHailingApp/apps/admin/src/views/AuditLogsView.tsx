import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Code, X } from 'lucide-react';
import { apiFetch } from '../api/client';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeta, setSelectedMeta] = useState<any>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {}),
      ...(actionFilter ? { action: actionFilter } : {}),
    });

    const res = await apiFetch<any>(`/admin/audit-logs?${query.toString()}`);
    if (res.ok && res.data) {
      setLogs(res.data.data);
      setTotal(res.data.total);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search, actionFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header, Filters & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Administrative Audit Trail</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Immutable, append-only record of all operational interventions ({total} actions logged)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Action Types</option>
            <option value="DRIVER_APPROVED">DRIVER_APPROVED</option>
            <option value="DRIVER_SUSPENDED">DRIVER_SUSPENDED</option>
            <option value="DRIVER_REJECTED">DRIVER_REJECTED</option>
            <option value="SUPPORT_TICKET_UPDATED">SUPPORT_TICKET_UPDATED</option>
          </select>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search action or entity..."
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

      {/* Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator</th>
                <th>Action</th>
                <th>Entity Target</th>
                <th>Target ID</th>
                <th style={{ textAlign: 'right' }}>Metadata Audit</th>
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
              ) : logs.length > 0 ? (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{l.admin?.name || 'Admin'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{l.admin?.email}</div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            l.action === 'DRIVER_APPROVED'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : l.action === 'DRIVER_SUSPENDED'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(59, 130, 246, 0.15)',
                          color:
                            l.action === 'DRIVER_APPROVED'
                              ? '#10b981'
                              : l.action === 'DRIVER_SUSPENDED'
                              ? '#ef4444'
                              : '#3b82f6',
                        }}
                      >
                        {l.action}
                      </span>
                    </td>
                    <td style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{l.entityType}</td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {l.entityId}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {l.metadata ? (
                        <button
                          onClick={() => setSelectedMeta(l.metadata)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Code size={14} /> View JSON
                        </button>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No audit records logged yet.
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

      {/* Metadata JSON Modal */}
      {selectedMeta && (
        <div className="modal-overlay" onClick={() => setSelectedMeta(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>Audit Action Metadata</h3>
              <button onClick={() => setSelectedMeta(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <pre
              style={{
                background: '#0a0d14',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#10b981',
                overflowX: 'auto',
                border: '1px solid #1e293b',
              }}
            >
              {JSON.stringify(selectedMeta, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
