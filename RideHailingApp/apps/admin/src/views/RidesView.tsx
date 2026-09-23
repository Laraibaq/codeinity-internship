import React, { useEffect, useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { apiFetch } from '../api/client';

export const RidesView: React.FC = () => {
  const [rides, setRides] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchRides = async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });

    const res = await apiFetch<any>(`/admin/rides?${query.toString()}`);
    if (res.ok && res.data) {
      setRides(res.data.data);
      setTotal(res.data.total);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRides();
  }, [page, search, statusFilter]);

  const viewDetails = async (id: string) => {
    setIsDetailLoading(true);
    setSelectedRide(null);
    const res = await apiFetch<any>(`/admin/rides/${id}`);
    if (res.ok && res.data) {
      setSelectedRide(res.data);
    }
    setIsDetailLoading(false);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header, Filters & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Ride Operations Monitoring</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{total} total rides in log</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Lifecycle Statuses</option>
            <option value="requested">Requested</option>
            <option value="offered">Offered</option>
            <option value="accepted">Accepted</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search address or ride ID..."
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

      {/* Rides Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ride ID</th>
                <th>Passenger</th>
                <th>Driver</th>
                <th>Route (Pickup ➔ Dropoff)</th>
                <th>Proposed</th>
                <th>Final Fare</th>
                <th>Status</th>
                <th>Requested At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
              ) : rides.length > 0 ? (
                rides.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {r.id.slice(0, 8)}...
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.passenger?.name || '—'}</td>
                    <td>{r.driver?.name || <span style={{ color: '#64748b' }}>Unassigned</span>}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '240px' }}>
                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{r.pickupAddress}</div>
                      <div style={{ color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>➔ {r.dropoffAddress}</div>
                    </td>
                    <td>PKR {r.proposedFare}</td>
                    <td style={{ fontWeight: 700, color: r.finalFare ? '#10b981' : '#94a3b8' }}>
                      {r.finalFare ? `PKR ${r.finalFare}` : '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${r.status}`}>{r.status}</span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(r.requestedAt).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => viewDetails(r.id)} className="btn btn-secondary btn-sm">
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No rides found matching current filters.
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

      {/* Ride Details Modal */}
      {(selectedRide || isDetailLoading) && (
        <div className="modal-overlay" onClick={() => setSelectedRide(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>Ride Operational Dossier</h3>
              <button onClick={() => setSelectedRide(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {isDetailLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="skeleton" style={{ height: '60px' }} />
                <div className="skeleton" style={{ height: '140px' }} />
              </div>
            ) : selectedRide ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Header Status Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>RIDE IDENTIFIER</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', fontFamily: 'monospace' }}>
                      {selectedRide.id}
                    </div>
                  </div>
                  <span className={`badge badge-${selectedRide.status}`} style={{ fontSize: '0.85rem' }}>
                    {selectedRide.status}
                  </span>
                </div>

                {/* Route & Geographic Coordinates */}
                <div className="card" style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} /> Route & Geographic Geometry
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                    <div>
                      <strong style={{ color: '#10b981' }}>PICKUP:</strong> {selectedRide.pickupAddress}
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Coordinates: {selectedRide.pickupLat}, {selectedRide.pickupLng}</div>
                    </div>
                    <div>
                      <strong style={{ color: '#ef4444' }}>DROPOFF:</strong> {selectedRide.dropoffAddress}
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Coordinates: {selectedRide.dropoffLat}, {selectedRide.dropoffLng}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid #1e293b' }}>
                      <span><strong style={{ color: '#cbd5e1' }}>Distance:</strong> {selectedRide.distanceKm} km</span>
                      <span><strong style={{ color: '#cbd5e1' }}>Estimated Duration:</strong> {selectedRide.etaMinutes} mins</span>
                    </div>
                  </div>
                </div>

                {/* Fares & AI Smart Fare Breakdown */}
                <div className="card" style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3b82f6', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={16} /> Fare Settlement & Economics
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                    <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PROPOSED FARE</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>PKR {selectedRide.proposedFare}</div>
                    </div>
                    <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#8b5cf6' }}>AI ADVISORY FARE</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#8b5cf6', marginTop: '4px' }}>PKR {selectedRide.aiRecommendedFare}</div>
                    </div>
                    <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#10b981' }}>FINAL AUTHORITATIVE</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                        {selectedRide.finalFare ? `PKR ${selectedRide.finalFare}` : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div className="card" style={{ padding: '14px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>PASSENGER</div>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{selectedRide.passenger?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedRide.passenger?.phone}</div>
                  </div>

                  <div className="card" style={{ padding: '14px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>DRIVER</div>
                    {selectedRide.driver ? (
                      <>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{selectedRide.driver.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedRide.driver.phone}</div>
                      </>
                    ) : (
                      <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No driver assigned</div>
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
