import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Save, MapPin, Plus, TrendingUp, RefreshCw } from 'lucide-react';

export default function AdminMarketPricePage() {
  const [prices, setPrices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [city, setCity] = useState('Chennai');
  const [refPrice, setRefPrice] = useState(250.0);

  const fetchPrices = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/api/admin/market-prices');
      setPrices(data.prices);
      setProducts(data.products);
      if (data.products.length > 0) {
        setSelectedProductId(data.products[0].product_id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch market price details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !city.trim() || refPrice === undefined || refPrice < 0) {
      alert('Please fill all fields with valid entries');
      return;
    }
    setError(''); setSuccess('');
    try {
      await axios.post('/api/admin/market-prices', {
        product_id: parseInt(selectedProductId),
        city: city.trim(),
        reference_price_per_kg: parseFloat(refPrice)
      });
      setSuccess('Market reference price updated successfully!');
      fetchPrices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save market price.');
    }
  };

  if (loading && prices.length === 0) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">📈 Daily Market Reference Prices</h1>
          <p className="page-subtitle">Configure pricing indexes by product and city to compare shop pricing</p>
        </div>
        <button onClick={fetchPrices} className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
          <RefreshCw size={14} /> Refresh Prices
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      <div className="grid grid-3" style={{ gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
        
        {/* Prices List */}
        <div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--gray-800)', fontSize: '1.25rem' }}>Active Market Prices</h2>
          {prices.length === 0 ? (
            <div className="card" style={{ background: 'white', padding: '3rem', textAlign: 'center' }}>
              <TrendingUp size={48} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
              <h3>No market reference prices defined</h3>
              <p className="text-muted text-sm">Add daily reference prices in cities near you using the form panel.</p>
            </div>
          ) : (
            <div className="card" style={{ background: 'white' }}>
              <div className="card-body" style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Product Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>City</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Reference Price</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Updated On</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div className="font-semibold">{p.product_name}</div>
                          <span className="badge badge-gray text-xs">{p.category}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="var(--text-secondary)" />
                          <span className="font-semibold">{p.city}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: 'var(--red-700)' }}>
                          ₹{p.reference_price_per_kg}/{p.unit}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          {new Date(p.price_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {p.created_by_name || 'Admin'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Set / Update Price Form */}
        <div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--gray-800)', fontSize: '1.25rem' }}>Update Price Guide</h2>
          <div className="card" style={{ background: 'white' }}>
            <div className="card-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <select
                    className="form-control"
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    required
                  >
                    {products.map(p => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.name} [{p.category}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">City Target</label>
                  <select
                    className="form-control"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    required
                  >
                    {['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Kolkata'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Market Reference Price (₹ per kg)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>₹</span>
                    <input
                      className="form-control"
                      type="number"
                      value={refPrice}
                      onChange={e => setRefPrice(parseFloat(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full" style={{ gap: 4 }}>
                  <Save size={16} /> Save Reference Price
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
