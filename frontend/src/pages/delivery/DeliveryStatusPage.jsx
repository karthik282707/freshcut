import { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, MapPin, Phone, CheckCircle, Package } from 'lucide-react';

export default function DeliveryStatusPage() {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [updating, setUpdating] = useState({});

    useEffect(() => {
        fetchActiveDeliveries();
    }, []);

    const fetchActiveDeliveries = async () => {
        try {
            const res = await axios.get('/api/delivery/active');
            setDeliveries(res.data);
        } catch (err) {
            setError('Failed to fetch active deliveries.');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        setUpdating(prev => ({ ...prev, [orderId]: true }));
        setError('');
        setMsg('');
        try {
            const res = await axios.patch(`/api/delivery/${orderId}/status`, { status: newStatus });
            setMsg(`✓ Order #${orderId} status set to ${newStatus}`);
            fetchActiveDeliveries();
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update order status.');
        } finally {
            setUpdating(prev => ({ ...prev, [orderId]: false }));
        }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header">
                <h1 className="page-title">📦 Active Transit Board</h1>
                <p className="page-subtitle">Track and progress active route shipments assigned to you</p>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}
            {msg && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{msg}</div>}

            {deliveries.length === 0 ? (
                <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                    <div className="empty-state-icon">🚚</div>
                    <h2>No active routes</h2>
                    <p>You have no active deliveries in progress. Head over to the Available Jobs directory to pick up orders.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {deliveries.map(route => (
                        <div key={route.id} className="card" style={{ marginBottom: 0 }}>
                            <div className="card-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Package size={16} className="text-muted" />
                                    <span className="font-semibold text-sm">Order #{route.id}</span>
                                </div>
                                <span className={`badge ${route.status === 'picked_up' ? 'badge-amber' : 'badge-blue'}`}>
                                    {route.status.toUpperCase().replace('_', ' ')}
                                </span>
                            </div>
                            <div className="card-body">
                                <div className="grid grid-2" style={{ gap: '1.5rem', marginBottom: '1.25rem' }}>
                                    {/* Pickup Node */}
                                    <div>
                                        <label className="text-xs text-muted font-bold block" style={{ textTransform: 'uppercase' }}>Shop Pickup</label>
                                        <div className="font-bold text-sm" style={{ marginTop: '0.15rem' }}>{route.shop_name}</div>
                                        <div className="text-xs text-muted mt-1">{route.shop_address}</div>
                                    </div>

                                    {/* Dropoff Node */}
                                    <div>
                                        <label className="text-xs text-muted font-bold block" style={{ textTransform: 'uppercase' }}>Customer Destination</label>
                                        <div className="font-bold text-sm" style={{ marginTop: '0.15rem' }}>{route.customer_name}</div>
                                        <div className="text-xs text-muted mt-1">{route.delivery_address}</div>
                                        <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-primary">
                                            <Phone size={12} /> {route.customer_phone}
                                        </div>
                                    </div>
                                </div>

                                {route.notes && (
                                    <div style={{ marginBottom: '1.25rem' }} className="p-3 bg-gray-50 border rounded text-xs text-muted">
                                        <strong>Notes:</strong> {route.notes}
                                    </div>
                                )}

                                <div className="flex justify-between items-center" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                    <div className="text-xs font-bold text-muted">
                                        Collect Payment: {route.total}
                                    </div>
                                    <div className="flex gap-2">
                                        {route.status === 'picked_up' && (
                                            <button
                                                onClick={() => updateStatus(route.id, 'in_transit')}
                                                disabled={updating[route.id]}
                                                className="btn btn-primary btn-sm flex items-center gap-1"
                                            >
                                                <Truck size={14} /> Mark In-Transit
                                            </button>
                                        )}
                                        {route.status === 'in_transit' && (
                                            <button
                                                onClick={() => updateStatus(route.id, 'delivered')}
                                                disabled={updating[route.id]}
                                                className="btn btn-green btn-sm flex items-center gap-1"
                                                style={{ backgroundColor: '#10b981', color: 'white' }}
                                            >
                                                <CheckCircle size={14} /> Set as Delivered
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
