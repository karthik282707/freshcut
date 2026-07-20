import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Star, Clock, Search, ChevronRight } from 'lucide-react';

export default function CustomerHomePage() {
  const [shops, setShops] = useState([]);
  const [city, setCity] = useState('Chennai');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchShops = async () => {
    setLoading(true);
    setError('');
    try {
      // Calls our customer Express API
      const { data } = await axios.get(`/api/shops?city=${city}`);
      setShops(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load shops. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [city]);

  const filtered = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">🥩 FreshCut Connect Marketplace</h1>
          <p className="page-subtitle">Order fresh-cut meats prepared specifically for you by local butchers</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin size={16} color="var(--primary)" />
            <span className="font-semibold text-sm">City:</span>
            <select 
              className="form-control" 
              style={{ width: 150 }} 
              value={city} 
              onChange={e => setCity(e.target.value)}
            >
              {['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Kolkata'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="search-bar" style={{ maxWidth: 400, marginBottom: '1.5rem' }}>
        <Search size={16} />
        <input 
          placeholder="Search butcher shops..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      {loading && <div className="loading-center"><div className="spinner" /></div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🏪</div>
          <h3>No verified shops found</h3>
          <p>We couldn't find any verified butcher shops in {city}. Try switching cities or check back later!</p>
        </div>
      )}

      <div className="grid grid-3">
        {filtered.map(shop => (
          <Link key={shop.id} to={`/customer/shops/${shop.id}`} className="card card-hover" style={{ textDecoration: 'none' }}>
            <div style={{ 
              height: 120, 
              background: `linear-gradient(135deg, var(--red-600) 0%, var(--red-900) 100%)`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '3rem' 
            }}>
              🥩
            </div>
            <div className="card-body">
              <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{shop.name}</h3>
                <span className="badge badge-green">Verified</span>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted" style={{ marginBottom: '0.4rem' }}>
                <MapPin size={13} /> {shop.address}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted" style={{ marginBottom: '0.75rem' }}>
                <span className="flex items-center gap-1"><Clock size={12} /> {shop.delivery_time} delivery</span>
                <span>Distance: {shop.distance}</span>
              </div>

              <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                <div className="flex items-center gap-1">
                  <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  <span className="font-semibold text-sm">{parseFloat(shop.rating || 0).toFixed(1)}</span>
                  <span className="text-xs text-muted">/ 5.0</span>
                </div>
                <span className="btn btn-primary btn-sm" style={{ gap: 4 }}>
                  Order Now <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
