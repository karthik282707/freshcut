import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Users, Store, ShoppingBag, AlertTriangle, ArrowRight, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('/api/reports/platform')
            .then(res => {
                setStats(res.data);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to fetch platform stats.');
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    // Process stats
    const usersCount = stats?.users?.reduce((sum, u) => sum + parseInt(u.count), 0) || 0;
    const shopsCount = stats?.shops?.reduce((sum, s) => sum + parseInt(s.count), 0) || 0;
    const pendingShops = stats?.shops?.find(s => s.status === 'pending')?.count || 0;

    const ordersCount = stats?.orders?.reduce((sum, o) => sum + parseInt(o.count), 0) || 0;
    const revenue = stats?.orders?.reduce((sum, o) => sum + parseFloat(o.revenue || 0), 0) || 0;

    const roleCounts = {};
    stats?.users?.forEach(u => { roleCounts[u.role] = u.count; });

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">🛡️ Admin Control Panel</h1>
                <p className="page-subtitle">Monitor and review platform performance, verify shops, manage systems</p>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}

            {/* Metric summaries */}
            <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: '#dbeafe' }}>
                        <Users color="#1d4ed8" size={24} />
                    </div>
                    <div className="stat-card-value" style={{ color: '#1d4ed8' }}>{usersCount}</div>
                    <div className="stat-card-label">Total Users</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: '#e0f2fe' }}>
                        <Store color="#0369a1" size={24} />
                    </div>
                    <div className="stat-card-value" style={{ color: '#0369a1' }}>{shopsCount}</div>
                    <div className="stat-card-label">Registered Shops {pendingShops > 0 && <span style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 600 }}>({pendingShops} pending)</span>}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: '#fef3c7' }}>
                        <ShoppingBag color="#b45309" size={24} />
                    </div>
                    <div className="stat-card-value" style={{ color: '#b45309' }}>{ordersCount}</div>
                    <div className="stat-card-label">Total Orders</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: '#dcfce7' }}>
                        <span style={{ fontSize: '1.25rem' }}>💰</span>
                    </div>
                    <div className="stat-card-value" style={{ color: '#15803d' }}>
                        ₹{revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="stat-card-label">Gross Transaction Vol.</div>
                </div>
            </div>

            {/* Quick configuration links */}
            <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Platform Hub Services</h3>
                    </div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            { to: '/admin/verify', label: '🏪 Shop Approvals', sub: `${pendingShops} pending shop registrations`, color: '#0369a1', badge: pendingShops > 0 ? `${pendingShops} warning` : null },
                            { to: '/admin/market', label: '📊 Market Price Controls', sub: 'Control benchmark reference prices', color: '#15803d' },
                            { to: '/admin/manage', label: '👥 User Role Management', sub: 'Manage permissions and role mappings', color: '#1d4ed8' },
                            { to: '/admin/complaints', label: '⚠️ Complaints & Resolutions', sub: 'Respond to customer issues', color: '#ef4444' }
                        ].map((srv, idx) => (
                            <Link key={idx} to={srv.to} className="card" style={{ textDecoration: 'none', margin: 0, padding: 0, border: `1px solid ${srv.color}20`, background: `${srv.color}05` }}>
                                <div className="card-body flex justify-between items-center" style={{ padding: '1rem 1.25rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>{srv.label}</div>
                                        <div className="text-xs text-muted" style={{ marginTop: '0.15rem' }}>{srv.sub}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {srv.badge && (
                                            <span className={`badge ${srv.badge.includes('warning') ? 'badge-amber' : ''}`} style={{ fontSize: '0.75rem' }}>
                                                {srv.badge.split(' ')[0]}
                                            </span>
                                        )}
                                        <ArrowRight size={18} style={{ color: srv.color }} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">User Segments</h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { role: 'Customer', count: roleCounts['customer'] || 0, color: '#1d4ed8' },
                                { role: 'Butcher', count: roleCounts['butcher'] || 0, color: '#0369a1' },
                                { role: 'Delivery Partner', count: roleCounts['delivery'] || 0, color: '#f59e0b' },
                                { role: 'Platform Admin', count: roleCounts['admin'] || 0, color: '#ef4444' }
                            ].map((seg, idx) => (
                                <div key={idx} className="flex justify-between items-center" style={{ paddingBottom: '0.75rem', borderBottom: idx < 3 ? '1px solid var(--border)' : 'none' }}>
                                    <div className="flex items-center gap-2">
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color }}></div>
                                        <span className="font-semibold text-sm">{seg.role}s</span>
                                    </div>
                                    <span className="font-bold text-sm bg-gray-100 px-2 py-0.5 rounded" style={{ padding: '0.125rem 0.5rem', background: 'var(--border)', borderRadius: '4px' }}>
                                        {seg.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
