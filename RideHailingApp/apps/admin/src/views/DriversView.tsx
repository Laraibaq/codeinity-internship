import React, { useEffect, useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Ban,
  XCircle,
  X,
  Star,
  Phone,
  Mail,
  Car,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { apiFetch } from '../api/client';

export const DriversView: React.FC = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Destructive Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'suspend';
    driver: any;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchDrivers = async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {}),
      ...(statusFilter ? { verificationStatus: statusFilter } : {}),
    });

    const res = await apiFetch<any>(`/admin/drivers?${query.toString()}`);
    if (res.ok && res.data) {
      setDrivers(res.data.data);
      setTotal(res.data.total);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDrivers();
  }, [page, search, statusFilter]);

  const viewDetails = async (id: string) => {
    setIsDetailLoading(true);
    setSelectedDriver(null);
    const res = await apiFetch<any>(`/admin/drivers/${id}`);
    if (res.ok && res.data) {
      setSelectedDriver(res.data);
    }
    setIsDetailLoading(false);
  };

  const handleAction = async () => {
    if (!confirmAction) return;
    setIsSubmittingAction(true);

    const { type, driver } = confirmAction;
    const res = await apiFetch<any>(`/admin/drivers/${driver.id}/${type}`, {
      method: 'POST',
      body: JSON.stringify({ reason: actionReason }),
    });

    setIsSubmittingAction(false);
    setConfirmAction(null);
    setActionReason('');

    if (res.ok) {
      fetchDrivers();
      if (selectedDriver && selectedDriver.driver.id === driver.id) {
        viewDetails(driver.id);
      }
    } else {
      alert(res.error || `Failed to ${type} driver`);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header, Filters & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Fleet & Driver Management</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{total} drivers in registry</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Verification Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search driver or plate..."
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

      {/* Drivers Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Live Status</th>
                <th>Vehicle</th>
                <th>Rating</th>
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
              ) : drivers.length > 0 ? (
                drivers.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{d.name}</td>
                    <td>{d.phone}</td>
                    <td>
                      <span className={`badge badge-${d.verificationStatus}`}>
                        {d.verificationStatus}
                      </span>
                    </td>
                    <td>
                      {d.isOnline ? (
                        <span className="badge badge-approved">ONLINE</span>
                      ) : (
                        <span className="badge" style={{ background: '#1e293b', color: '#94a3b8' }}>OFFLINE</span>
                      )}
                    </td>
                    <td>
                      {d.vehicle ? (
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                          {d.vehicle.make} {d.vehicle.model} ({d.vehicle.registrationNumber || 'No Plate'})
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>No Vehicle</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} color="#eab308" fill="#eab308" />
                        <span>{d.rating ? d.rating.toFixed(1) : 'New'}</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button onClick={() => viewDetails(d.id)} className="btn btn-secondary btn-sm" title="View Profile">
                          <Eye size={14} />
                        </button>

                        {d.verificationStatus !== 'approved' && (
                          <button
                            onClick={() => setConfirmAction({ type: 'approve', driver: d })}
                            className="btn btn-primary btn-sm"
                            title="Approve Driver"
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>
                        )}

                        {d.verificationStatus === 'approved' && (
                          <button
                            onClick={() => setConfirmAction({ type: 'suspend', driver: d })}
                            className="btn btn-danger btn-sm"
                            title="Suspend Driver"
                          >
                            <Ban size={14} /> Suspend
                          </button>
                        )}

                        {d.verificationStatus === 'pending' && (
                          <button
                            onClick={() => setConfirmAction({ type: 'reject', driver: d })}
                            className="btn btn-warning btn-sm"
                            title="Reject Application"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No drivers found.
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

      {/* Confirmation Dialog for Destructive / Significant Actions */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background:
                    confirmAction.type === 'approve'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : confirmAction.type === 'suspend'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                  color:
                    confirmAction.type === 'approve'
                      ? '#10b981'
                      : confirmAction.type === 'suspend'
                      ? '#ef4444'
                      : '#f59e0b',
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                  Confirm {confirmAction.type.toUpperCase()} Action
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Target Driver: <strong style={{ color: '#f8fafc' }}>{confirmAction.driver.name}</strong>
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '16px' }}>
              {confirmAction.type === 'suspend'
                ? 'Suspending this driver will immediately force them offline, cancel active matching eligibility, and disallow accepting any new rides.'
                : confirmAction.type === 'reject'
                ? 'Rejecting this driver application will notify the applicant and prevent them from operating on the marketplace.'
                : 'Approving this driver will permit them to go online and receive live ride requests from passengers.'}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                ADMIN AUDIT REASON (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="Reason for status change..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setConfirmAction(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={isSubmittingAction}
                className={
                  confirmAction.type === 'approve'
                    ? 'btn btn-primary'
                    : confirmAction.type === 'suspend'
                    ? 'btn btn-danger'
                    : 'btn btn-warning'
                }
              >
                {isSubmittingAction ? 'Executing...' : `Confirm ${confirmAction.type}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Details Modal */}
      {(selectedDriver || isDetailLoading) && (
        <div className="modal-overlay" onClick={() => setSelectedDriver(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Driver Dossier</h3>
              <button onClick={() => setSelectedDriver(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {isDetailLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="skeleton" style={{ height: '60px' }} />
                <div className="skeleton" style={{ height: '140px' }} />
              </div>
            ) : selectedDriver ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Profile Header */}
                <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#f8fafc' }}>
                        {selectedDriver.driver.name}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} /> {selectedDriver.driver.phone}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={14} /> {selectedDriver.driver.email || 'No email'}
                        </span>
                      </div>
                    </div>
                    <span className={`badge badge-${selectedDriver.driver.verificationStatus}`}>
                      {selectedDriver.driver.verificationStatus}
                    </span>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="card" style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Car size={16} /> Vehicle Information
                  </h4>
                  {selectedDriver.driver.vehicle ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.85rem' }}>
                      <div><span style={{ color: '#64748b' }}>Make / Model:</span> {selectedDriver.driver.vehicle.make} {selectedDriver.driver.vehicle.model}</div>
                      <div><span style={{ color: '#64748b' }}>Registration:</span> {selectedDriver.driver.vehicle.registrationNumber || 'Not specified'}</div>
                      <div><span style={{ color: '#64748b' }}>Type:</span> {selectedDriver.driver.vehicle.type || 'car'}</div>
                      <div><span style={{ color: '#64748b' }}>Color:</span> {selectedDriver.driver.vehicle.color || 'Standard'}</div>
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No vehicle registered yet.</p>
                  )}
                </div>

                {/* Identity & Legal Docs */}
                <div className="card" style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3b82f6', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} /> Identity & Legal Documents
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.85rem' }}>
                    <div><span style={{ color: '#64748b' }}>CNIC Number:</span> {selectedDriver.driver.cnicNumber || 'Not provided'}</div>
                    <div><span style={{ color: '#64748b' }}>License Number:</span> {selectedDriver.driver.licenseNumber || 'Not provided'}</div>
                    <div>
                      <span style={{ color: '#64748b' }}>License Front:</span>{' '}
                      {selectedDriver.driver.licenseDocFrontUrl ? <span style={{ color: '#10b981' }}>Uploaded</span> : <span style={{ color: '#ef4444' }}>Missing</span>}
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>CNIC Document:</span>{' '}
                      {selectedDriver.driver.cnicDocUrl ? <span style={{ color: '#10b981' }}>Uploaded</span> : <span style={{ color: '#ef4444' }}>Missing</span>}
                    </div>
                  </div>
                </div>

                {/* Wallet Balance */}
                {selectedDriver.wallet && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '14px 18px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>DRIVER WALLET BALANCE</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                        PKR {selectedDriver.wallet.balance.toLocaleString()}
                      </div>
                    </div>
                    <span className="badge badge-approved">DRIVER LEDGER</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
