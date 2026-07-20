import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Package, DollarSign, ShoppingBag, Star, Store } from 'lucide-react';

export default function ButcherDashboard() {
    const { user } = useAuth();
    const [shop, setShop] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/shops/owner/mine').then(r => {
            setShop(r.data);
            if (r.data) {
                axios.get(`/api/orders/shop/${r.data.id}`).then(o => setOrders(o.data));
                setLoading(false);
            } else setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    if (!shop) return (
        <div className="empty-state" style={{ paddingTop: '3rem' }}>
            <div className="empty-state-icon">🏪</div>
            <h2>No shop registered yet</h2>
            <p style={{ marginBottom: '1.5rem' }}>Set up your shop profile to start receiving orders</p>
            <Link to="/butcher/profile" className="btn btn-primary btn-lg">Register Your Shop</Link>
        </div>
    );

    const pending = orders.filter(o => o.status === 'placed').length;
    const todayRevenue = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString() && !['rejected', 'cancelled'].includes(o.status))
        .reduce((s, o) => s + parseFloat(o.total), 0);
    const completed = orders.filter(o => o.status === 'delivered').length;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
                <p className="page-subtitle">{shop.name} · {shop.city}</p>
            </div>

            <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
                {[
                    { label: "Pending Orders", value: pending, icon: '🔔', color: '#b45309', bg: '#fef3c7' },
                    { label: "Today's Revenue", value: `₹${todayRevenue.toFixed(0)}`, icon: '💰', color: '#15803d', bg: '#dcfce7' },
                    { label: "Completed Orders", value: completed, icon: '✅', color: '#1d4ed8', bg: '#dbeafe' },
                    { label: "Shop Rating", value: `${parseFloat(shop.rating_avg || 0).toFixed(1)} ⭐`, icon: '⭐', color: '#c9372a', bg: '#fde8e8' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-card-icon" style={{ background: s.bg }}>
                            <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                        </div>
                        <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Quick actions */}
                <div className="card">
                    <div className="card-header"><h3>Quick Actions</h3></div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            { to: '/butcher/orders', label: '📋 Manage Orders', sub: `${pending} pending`, color: '#b45309' },
                            { to: '/butcher/stock', label: '📦 Update Stock', sub: 'Daily stock refresh', color: '#1d4ed8' },
                            { to: '/butcher/pricing', label: '💵 Update Prices', sub: 'Set your selling price', color: '#15803d' },
                            { to: '/butcher/sales', label: '📊 View Sales', sub: 'Charts & analytics', color: '#c9372a' },
                        ].map(a => (
                            <Link key={a.to} to={a.to} className="card" style={{ textDecoration: 'none', marginBottom: 0, border: `1px solid ${a.color}20`, background: `${a.color}08` }}>
                                <div className="card-body flex justify-between items-center" style={{ padding: '0.875rem 1rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.label}</div>
                                        <div className="text-xs text-muted">{a.sub}</div>
                                    </div>
                                    <span style={{ color: a.color, fontSize: '1.2rem' }}>→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent orders */}
                <div className="card">
                    <div className="card-header flex justify-between items-center">
                        <h3>Recent Orders</h3>
                        <Link to="/butcher/orders" className="btn btn-ghost btn-sm">View all</Link>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {orders.slice(0, 5).length === 0 && (
                            <div className="empty-state" style={{ padding: '2rem' }}>No orders yet</div>
                        )}
                        {orders.slice(0, 5).map(o => (
                            <div key={o.id} className="flex justify-between items-center" style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <div className="font-semibold text-sm">{o.customer_name}</div>
                                    <div className="text-xs text-muted">₹{o.total}</div>
                                </div>
                                <span className={`badge ${o.status === 'placed' ? 'badge-amber' : o.status === 'delivered' ? 'badge-green' : 'badge-blue'}`}>
                                    {o.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
