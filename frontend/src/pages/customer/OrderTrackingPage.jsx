import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Circle, Clock, Truck, Package, Star } from 'lucide-react';

const STEPS = [
    { status: 'placed', label: 'Order Placed', icon: '🧾' },
    { status: 'accepted', label: 'Accepted by Shop', icon: '✅' },
    { status: 'preparing', label: 'Preparing Your Order', icon: '🔪' },
    { status: 'ready', label: 'Ready for Pickup', icon: '📦' },
    { status: 'picked_up', label: 'Picked Up', icon: '🚴' },
    { status: 'in_transit', label: 'Out for Delivery', icon: '🚗' },
    { status: 'delivered', label: 'Delivered', icon: '🎉' },
];

const ORDER_IDX = Object.fromEntries(STEPS.map((s, i) => [s.status, i]));

export default function OrderTrackingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = () => axios.get(`/api/orders/${id}`).then(r => setOrder(r.data)).catch(() => { });
        fetch();
        setLoading(false);
        const poll = setInterval(fetch, 10000);
        return () => clearInterval(poll);
    }, [id]);

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;
    if (!order) return <div className="alert alert-error">Order not found</div>;

    const currentIdx = ORDER_IDX[order.status] ?? 0;

    return (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}>← Back</button>

            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #1a1010, #3d1f1f)', padding: '1.5rem', borderRadius: '12px 12px 0 0' }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Order #{order.id}</div>
                            <h2 style={{ color: 'white', fontSize: '1.25rem' }}>{order.shop_name}</h2>
                        </div>
                        <span className={`badge ${order.status === 'delivered' ? 'badge-green' : order.status === 'rejected' ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.875rem' }}>
                            {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="card-body">
                    <div className="stepper">
                        {STEPS.map((step, i) => {
                            const isDone = i < currentIdx;
                            const isActive = i === currentIdx;
                            const isLast = i === STEPS.length - 1;
                            return (
                                <div key={step.status} className="step-item">
                                    <div className="step-dot-col">
                                        <div className={`step-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                                            {isDone ? <CheckCircle size={16} /> : isActive ? step.icon : <Circle size={14} />}
                                        </div>
                                        {!isLast && <div className={`step-line ${isDone ? 'done' : ''}`} />}
                                    </div>
                                    <div className="step-content">
                                        <div className={`step-title ${!isDone && !isActive ? 'text-muted' : ''}`}>{step.label}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Order details */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-header flex justify-between">
                    <h3>Order Items</h3>
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>₹{order.total}</span>
                </div>
                <div className="card-body">
                    {(order.items || []).map(item => (
                        <div key={item.id} className="flex justify-between items-center" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <div className="font-semibold text-sm">{item.product_name}</div>
                                <div className="text-xs text-muted">{item.cutting_style} · {item.quantity} kg</div>
                            </div>
                            <div className="font-bold">₹{item.line_total}</div>
                        </div>
                    ))}
                    <div className="flex justify-between text-sm" style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Delivery address</span><span>{order.delivery_address}</span>
                    </div>
                    {order.delivery_partner_name && (
                        <div className="flex gap-2 items-center" style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--blue-100)', borderRadius: 8, fontSize: '0.875rem' }}>
                            <Truck size={16} color="var(--blue-500)" />
                            <span>Delivery partner: <strong>{order.delivery_partner_name}</strong></span>
                        </div>
                    )}
                </div>
            </div>

            {order.status === 'delivered' && (
                <div className="card" style={{ background: 'var(--green-100)', border: '1px solid #86efac' }}>
                    <div className="card-body flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span style={{ fontSize: '1.5rem' }}>🎉</span>
                            <div>
                                <div className="font-bold">Order Delivered!</div>
                                <div className="text-sm text-muted">How was your experience?</div>
                            </div>
                        </div>
                        <Link to={`/customer/review/${order.id}`} className="btn btn-primary btn-sm">
                            <Star size={14} /> Leave Review
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
