import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, MapPin, DollarSign, Store, ShoppingBag, ArrowRight } from 'lucide-react';

export default function AssignmentsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [accepting, setAccepting] = useState({});

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const res = await axios.get('/api/delivery/assignments');
            setAssignments(res.data);
        } catch (err) {
            setError('Failed to fetch available assignments.');
        } finally {
            setLoading(false);
        }
    };

    const acceptJob = async (orderId) => {
        setAccepting(prev => ({ ...prev, [orderId]: true }));
        setError('');
        try {
            await axios.patch(`/api/delivery/${orderId}/accept`);
            setMsg('🎉 Delivery accepted! Directing to active transit panel.');
            setTimeout(() => {
                navigate('/delivery/active');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to accept delivery. It may have been taken by another partner.');
            fetchAssignments();
        } finally {
            setAccepting(prev => ({ ...prev, [orderId]: false }));
        }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">🛵 Available Deliveries</h1>
                    <p className="page-subtitle">Pick up ready orders from local butchers and transport them to customers</p>
                </div>
                <Link to="/delivery/active" className="btn btn-ghost btn-sm flex items-center gap-1">
                    Active Deliveries <ArrowRight size={14} />
                </Link>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}
            {msg && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{msg}</div>}

            {assignments.length === 0 ? (
                <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                    <div className="empty-state-icon">🛵</div>
                    <h2>No orders ready for pickup</h2>
                    <p>Check back soon. Orders will appear here once butchers finish preparing cuts and mark them ready.</p>
                    <button onClick={fetchAssignments} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Refresh List
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {assignments.map(order => (
                        <div key={order.id} className="card" style={{ marginBottom: 0 }}>
                            <div className="card-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-2">
                                    <ShoppingBag size={18} className="text-primary" />
                                    <span className="font-semibold text-sm">Order #{order.id}</span>
                                </div>
                                <div className="font-bold text-lg" style={{ color: '#15803d' }}>
                                    Fee: ₹{parseFloat(order.delivery_fee || 30).toFixed(0)}
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="grid grid-2" style={{ gap: '1.5rem', marginBottom: '1rem' }}>
                                    {/* Pickup Info */}
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <div style={{ fontSize: '1.25rem', marginTop: '0.15rem' }}>🏪</div>
                                        <div>
                                            <label className="text-xs text-muted font-bold block" style={{ textTransform: 'uppercase' }}>Butcher Pickup</label>
                                            <div className="font-bold text-sm" style={{ marginTop: '0.15rem' }}>{order.shop_name}</div>
                                            <div className="text-xs text-muted" style={{ marginTop: '0.05rem' }}>{order.shop_address}</div>
                                        </div>
                                    </div>

                                    {/* Dropoff Info */}
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <div style={{ fontSize: '1.25rem', marginTop: '0.15rem' }}>📍</div>
                                        <div>
                                            <label className="text-xs text-muted font-bold block" style={{ textTransform: 'uppercase' }}>Customer Dropoff</label>
                                            <div className="font-bold text-sm" style={{ marginTop: '0.15rem' }}>{order.customer_name}</div>
                                            <div className="text-xs text-muted" style={{ marginTop: '0.05rem' }}>{order.delivery_address}, {order.city}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                    <div className="text-xs text-muted">
                                        Total Weight/Value: ₹{order.total} (COD/Paid via Gateway)
                                    </div>
                                    <button
                                        onClick={() => acceptJob(order.id)}
                                        disabled={accepting[order.id]}
                                        className="btn btn-primary"
                                    >
                                        {accepting[order.id] ? 'Accepting...' : 'Accept & Start Route'}
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
