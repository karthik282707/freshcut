import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, ShieldAlert, Award, Calendar, RefreshCw } from 'lucide-react';

export default function MarketPricePage() {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [edits, setEdits] = useState({});
    const [saving, setSaving] = useState({});
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchPrices();
    }, []);

    const fetchPrices = async () => {
        try {
            const res = await axios.get('/api/market');
            setPrices(res.data);
            const ed = {};
            res.data.forEach(item => {
                ed[item.category_id] = item.reference_price;
            });
            setEdits(ed);
        } catch (err) {
            setError('Failed to fetch market prices.');
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (catId, val) => {
        setEdits({ ...edits, [catId]: val });
    };

    const savePrice = async (categoryId, categoryName) => {
        setSaving(s => ({ ...s, [categoryId]: true }));
        setError('');
        setMsg('');
        try {
            const res = await axios.put(`/api/market/${categoryId}`, {
                reference_price: parseFloat(edits[categoryId])
            });
            setPrices(prices.map(p => p.category_id === categoryId ? {
                ...p,
                reference_price: res.data.reference_price,
                updated_at: res.data.updated_at,
                updated_by_name: 'You'
            } : p));
            setMsg(`✓ Benchmark price for ${categoryName} updated successfully.`);
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setError('Failed to update benchmark price.');
        } finally {
            setSaving(s => ({ ...s, [categoryId]: false }));
        }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">📊 Market Price Dashboard</h1>
                    <p className="page-subtitle">Configure reference benchmark prices for major meat categories</p>
                </div>
                <button onClick={fetchPrices} className="btn btn-ghost btn-sm flex items-center gap-1">
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}
            {msg && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{msg}</div>}

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Category Benchmark Rules</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div className="table-wrap" style={{ margin: 0, border: 'none' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Category ID</th>
                                    <th>Meat Category</th>
                                    <th>Current Benchmark Price (₹/kg)</th>
                                    <th>New Benchmark Price (₹/kg)</th>
                                    <th>Last Updated By</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prices.map(price => (
                                    <tr key={price.category_id}>
                                        <td><span className="text-muted">#{price.category_id}</span></td>
                                        <td><span className="font-semibold" style={{ fontSize: '1rem' }}>{price.category_name}</span></td>
                                        <td>
                                            <span className="font-bold" style={{ color: 'var(--text)' }}>
                                                ₹{parseFloat(price.reference_price).toFixed(2)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center">
                                                <span style={{ marginRight: '0.25rem', color: 'var(--text-muted)' }}>₹</span>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    style={{ width: '100px', display: 'inline-block' }}
                                                    min="0"
                                                    value={edits[price.category_id] ?? ''}
                                                    onChange={(e) => handlePriceChange(price.category_id, e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-xs">
                                                <div>{price.updated_by_name || 'System Seeder'}</div>
                                                <div className="text-muted">{new Date(price.updated_at).toLocaleDateString()}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => savePrice(price.category_id, price.category_name)}
                                                disabled={saving[price.category_id]}
                                                className="btn btn-primary btn-sm"
                                            >
                                                {saving[price.category_id] ? 'Saving...' : 'Save'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="alert alert-warning flex items-start gap-2" style={{ marginTop: '1.5rem', background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }}>
                <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                <div>
                    <div className="font-semibold text-sm">Reference Benchmark Notice</div>
                    <p className="text-xs" style={{ margin: 0, marginTop: '0.15rem' }}>These reference prices are visible key indices for customers and butchers. When butchers set their selling prices, they will see pricing variances compared to these admin-established values. Ensure you keep benchmark values close to the daily market average.</p>
                </div>
            </div>
        </div>
    );
}
