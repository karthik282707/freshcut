import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, Legend
} from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, Award, Calendar } from 'lucide-react';

export default function SalesDashboard() {
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [days, setDays] = useState(30);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('/api/shops/owner/mine')
            .then(res => {
                if (res.data) {
                    setShop(res.data);
                    fetchReport(res.data.id, days);
                } else {
                    setLoading(false);
                }
            })
            .catch(err => {
                setError('Failed to load shop details.');
                setLoading(false);
            });
    }, [days]);

    const fetchReport = async (shopId, scopeDays) => {
        try {
            const res = await axios.get(`/api/reports/sales?shop_id=${shopId}&days=${scopeDays}`);
            setReportData(res.data);
        } catch (err) {
            setError('Failed to fetch sales report.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    if (!shop) {
        return (
            <div className="empty-state" style={{ paddingTop: '3rem' }}>
                <div className="empty-state-icon">🏪</div>
                <h2>Shop Registration Required</h2>
                <p>Register your shop profile before you can access the sales analytics tools.</p>
            </div>
        );
    }

    const { sales_by_day = [], top_products = [], summary = {} } = reportData || {};

    const formattedSalesData = sales_by_day.map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        revenue: parseFloat(item.revenue || 0),
        order_count: parseInt(item.order_count || 0)
    }));

    const COLORS = ['#1d4ed8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div>
            <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">📊 Sales Dashboard</h1>
                    <p className="page-subtitle">Historical performance data and store analytics for {shop.name}</p>
                </div>
                <div className="flex items-center gap-2" style={{ background: 'var(--card-bg)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <Calendar size={16} className="text-muted" />
                    <select
                        value={days}
                        onChange={(e) => {
                            setLoading(true);
                            setDays(parseInt(e.target.value));
                        }}
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 600, cursor: 'pointer' }}
                    >
                        <option value={7}>Last 7 Days</option>
                        <option value={30}>Last 30 Days</option>
                        <option value={90}>Last 90 Days</option>
                    </select>
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}

            {/* Metrics cards */}
            <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: '#dcfce7' }}>
                        <DollarSign color="#15803d" size={24} />
                    </div>
                    <div className="stat-card-value" style={{ color: '#15803d' }}>
                        ₹{parseFloat(summary.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="stat-card-label">Total Revenue ({days}d)</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: '#dbeafe' }}>
                        <ShoppingBag color="#1d4ed8" size={24} />
                    </div>
                    <div className="stat-card-value" style={{ color: '#1d4ed8' }}>
                        {summary.total_orders || 0}
                    </div>
                    <div className="stat-card-label">Total Orders ({days}d)</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: '#fef3c7' }}>
                        <TrendingUp color="#b45309" size={24} />
                    </div>
                    <div className="stat-card-value" style={{ color: '#b45309' }}>
                        ₹{parseFloat(summary.avg_order_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="stat-card-label">Average Order Value</div>
                </div>
            </div>

            {/* Charts section */}
            <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Revenue trends chart */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Revenue Trends</h3>
                    </div>
                    <div className="card-body">
                        {formattedSalesData.length === 0 ? (
                            <div className="empty-state" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                No sales data recorded for the selected period
                            </div>
                        ) : (
                            <div style={{ width: '100%', height: 320 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={formattedSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#15803d" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                        <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                        <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                                        <Area type="monotone" dataKey="revenue" stroke="#15803d" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top products section */}
                <div className="card">
                    <div className="card-header flex items-center gap-2">
                        <Award size={18} className="text-amber-500" />
                        <h3 className="card-title">Top 5 Best Sellers</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {top_products.length === 0 ? (
                            <div className="empty-state" style={{ padding: '3rem' }}>
                                No product sales recorded
                            </div>
                        ) : (
                            <div>
                                {top_products.map((prod, index) => (
                                    <div key={prod.name} className="flex items-center justify-between" style={{ padding: '1rem 1.25rem', borderBottom: index < top_products.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${COLORS[index % COLORS.length]}15`, color: COLORS[index % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">{prod.name}</div>
                                                <div className="text-xs text-muted">{parseFloat(prod.total_qty).toFixed(1)} kg sold</div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                                            ₹{parseFloat(prod.total_revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Count trends */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h3 className="card-title">Daily Order Volume</h3>
                </div>
                <div className="card-body">
                    {formattedSalesData.length === 0 ? (
                        <div className="empty-state" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            No orders placed during the selected period
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <BarChart data={formattedSalesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                    <YAxis allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                    <Tooltip formatter={(value) => [value, 'Orders']} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                                    <Bar dataKey="order_count" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
