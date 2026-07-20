import { useState, useEffect } from 'react';
import axios from 'axios';
import { Store, User, Mail, ShieldAlert, Check, X, ShieldClose } from 'lucide-react';

export default function ShopVerificationPage() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const res = await axios.get('/api/shops/admin/all');
            setShops(res.data);
        } catch (err) {
            setError('Failed to fetch shops.');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await axios.patch(`/api/shops/${id}/verify`, { status });
            setShops(shops.map(s => s.id === id ? { ...s, status: res.data.status } : s));
            setMsg(`Shop status updated to ${status} successfully.`);
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setError('Failed to update shop status.');
            setTimeout(() => setError(''), 3000);
        }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    const filteredShops = shops.filter(s => filter === 'all' || s.status === filter);

    return (
        <div>
            <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">🏪 Shop Approval Manager</h1>
                    <p className="page-subtitle">Verify newly registered butcher shops, authorize actions, or suspend vendors</p>
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'verified', 'suspended'].map(statusOption => (
                        <button
                            key={statusOption}
                            onClick={() => setFilter(statusOption)}
                            className={`btn btn-sm ${filter === statusOption ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {statusOption}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}
            {msg && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{msg}</div>}

            {filteredShops.length === 0 ? (
                <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                    <div className="empty-state-icon text-muted">🏪</div>
                    <h2>No shops found</h2>
                    <p>There are no shops that match the status filter: <strong>{filter}</strong></p>
                </div>
            ) : (
                <div className="grid grid-2" style={{ gap: '1.5rem' }}>
                    {filteredShops.map(shop => (
                        <div key={shop.id} className="card flex flex-col justify-between" style={{ marginBottom: 0 }}>
                            <div className="card-header flex justify-between items-start" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 700 }}>{shop.name}</h3>
                                    <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>Registered {new Date(shop.created_at).toLocaleDateString()}</div>
                                </div>
                                <span className={`badge ${shop.status === 'verified' ? 'badge-green' : shop.status === 'suspended' ? 'badge-red' : 'badge-amber'}`}>
                                    {shop.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="card-body">
                                <p className="text-sm" style={{ marginBottom: '1rem', fontStyle: shop.description ? 'normal' : 'italic' }}>
                                    {shop.description || 'No description provided.'}
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-muted" />
                                        <span><strong>Owner:</strong> {shop.owner_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-muted" />
                                        <span><strong>Email:</strong> {shop.owner_email}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>📍</span>
                                        <span><strong>Address:</strong> {shop.address}, {shop.city}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body" style={{ background: 'var(--card-bg)', borderTop: '1px solid var(--border)', padding: '1rem 1.25rem', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                                <div className="flex justify-end gap-2">
                                    {shop.status !== 'verified' && (
                                        <button
                                            onClick={() => updateStatus(shop.id, 'verified')}
                                            className="btn btn-green btn-sm flex items-center gap-1"
                                            style={{ backgroundColor: '#10b981', color: 'white' }}
                                        >
                                            <Check size={14} /> Approve Shop
                                        </button>
                                    )}
                                    {shop.status !== 'suspended' && (
                                        <button
                                            onClick={() => updateStatus(shop.id, 'suspended')}
                                            className="btn btn-red btn-sm flex items-center gap-1"
                                            style={{ backgroundColor: '#ef4444', color: 'white' }}
                                        >
                                            <ShieldClose size={14} /> Suspend Shop
                                        </button>
                                    )}
                                    {shop.status === 'suspended' && (
                                        <button
                                            onClick={() => updateStatus(shop.id, 'pending')}
                                            className="btn btn-ghost btn-sm flex items-center gap-1"
                                        >
                                            Set to Pending
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
