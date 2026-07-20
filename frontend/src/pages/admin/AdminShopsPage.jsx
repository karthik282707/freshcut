import { useState, useEffect } from 'react';
import axios from 'axios';
import { BadgeCheck, ShieldAlert, Check, X, RefreshCw, FileText } from 'lucide-react';

export default function AdminShopsPage() {
  const [pendingShops, setPendingShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPendingShops = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/api/admin/shops/pending');
      setPendingShops(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pending shops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingShops();
  }, []);

  const handleVerify = async (shopId) => {
    setError(''); setSuccess('');
    try {
      await axios.put(`/api/admin/shops/${shopId}/verify`);
      setSuccess('Butcher shop successfully verified! It is now visible to customers.');
      fetchPendingShops();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to verify shop');
    }
  };

  const handleReject = async (shopId) => {
    if (!window.confirm('Are you sure you want to reject this shop?')) return;
    setError(''); setSuccess('');
    try {
      await axios.put(`/api/admin/shops/${shopId}/reject`);
      setSuccess('Butcher shop registration rejected.');
      fetchPendingShops();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to reject shop');
    }
  };

  if (loading && pendingShops.length === 0) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">🏪 Shop Verification</h1>
          <p className="page-subtitle">Review business details and license numbers for new butcher registrations</p>
        </div>
        <button onClick={fetchPendingShops} className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
          <RefreshCw size={14} /> Refresh List
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      {pendingShops.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <h3>All caught up!</h3>
          <p>There are no pending butcher shop verification requests at this time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pendingShops.map(shop => (
            <div key={shop.id} className="card" style={{ background: 'white' }}>
              <div className="card-body flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--red-900)' }}>{shop.name}</h3>
                    <span className="badge badge-amber text-xs">Pending Review</span>
                  </div>

                  <div className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
                    📍 <strong>Location:</strong> {shop.address}, {shop.city}
                  </div>

                  <div className="text-xs text-muted" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span>👤 <strong>Owner:</strong> {shop.owner_name} ({shop.owner_phone})</span>
                    <span>✉️ <strong>Email:</strong> {shop.owner_email}</span>
                  </div>

                  <div style={{ 
                    marginTop: '0.75rem', 
                    background: 'var(--gray-50)', 
                    padding: '0.6rem 0.8rem', 
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    border: '1px solid var(--border)',
                    width: 'fit-content'
                  }}>
                    <FileText size={14} color="var(--primary)" />
                    <span><strong>License Number:</strong> {shop.license_number || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex gap-2" style={{ flexShrink: 0 }}>
                  <button 
                    onClick={() => handleVerify(shop.id)} 
                    className="btn btn-success btn-sm"
                    style={{ gap: 4 }}
                  >
                    <Check size={14} /> Approve & Verify
                  </button>
                  <button 
                    onClick={() => handleReject(shop.id)} 
                    className="btn btn-danger btn-sm"
                    style={{ gap: 4 }}
                  >
                    <X size={14} /> Reject Application
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
