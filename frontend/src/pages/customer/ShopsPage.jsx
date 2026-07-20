import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Star, Clock, Search, ChevronRight } from 'lucide-react';

export default function ShopsPage() {
    const [shops, setShops] = useState([]);
    const [city, setCity] = useState('Chennai');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchShops = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await axios.get(`/api/shops?city=${city}`);
            setShops(data);
        } catch {
            setError('Failed to load shops');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchShops(); }, [city]);

    const filtered = shops.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.address.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">🥩 Nearby Shops</h1>
                    <p className="page-subtitle">Find fresh meat from verified butchers near you</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} color="var(--primary)" />
                        <select className="form-control" style={{ width: 160 }} value={city} onChange={e => setCity(e.target.value)}>
                            {['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Kolkata'].map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="search-bar" style={{ maxWidth: 440, marginBottom: '1.5rem' }}>
                <Search size={16} />
                <input placeholder="Search shops..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading && <div className="loading-center"><div className="spinner" /></div>}
            {error && <div className="alert alert-error">{error}</div>}

            {!loading && filtered.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">🏪</div>
                    <h3>No shops found</h3>
                    <p>Try a different city or search term</p>
                </div>
            )}

            <div className="grid grid-3">
                {filtered.map(shop => (
                    <Link key={shop.id} to={`/customer/shops/${shop.id}`} className="card card-hover" style={{ textDecoration: 'none' }}>
                        <div style={{ height: 140, background: `linear-gradient(135deg, #c9372a, #7b1414)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                            🥩
                        </div>
                        <div className="card-body">
                            <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1rem' }}>{shop.name}</h3>
                                <span className={`badge ${shop.status === 'verified' ? 'badge-green' : 'badge-amber'}`}>
                                    {shop.status === 'verified' ? '✓ Verified' : shop.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 text-sm text-muted" style={{ marginBottom: '0.375rem' }}>
                                <MapPin size={13} /> {shop.address}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted" style={{ marginBottom: '0.75rem' }}>
                                <Clock size={13} /> {shop.opens_at?.slice(0, 5)} – {shop.closes_at?.slice(0, 5)}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                    <span className="font-semibold text-sm">{parseFloat(shop.rating_avg || 0).toFixed(1)}</span>
                                    <span className="text-xs text-muted">({shop.rating_count})</span>
                                </div>
                                <span className="btn btn-primary btn-sm" style={{ gap: 4 }}>View <ChevronRight size={14} /></span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
