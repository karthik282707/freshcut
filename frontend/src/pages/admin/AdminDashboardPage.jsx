import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Users, Store, ShoppingBag, BarChart2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/reports');
      setReports(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch platform metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">🛡️ Admin Administration Console</h1>
          <p className="page-subtitle">Oversee local meat marketplace metrics, verify shops, and update price guides</p>
        </div>
        <button onClick={fetchReports} className="btn btn-ghost btn-sm">
          Refresh Statistics
        </button>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'white' }}>
          <div className="card-body flex gap-3 items-center">
            <div style={{ padding: '0.75rem', background: '#ecfdf5', color: '#059669', borderRadius: 12 }}>
              <BarChart2 size={24} />
            </div>
            <div>
              <div className="text-xs text-muted">Platform Total Revenue</div>
              <div className="text-2xl font-bold">₹{reports.total_sales?.toFixed(0)}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'white' }}>
          <div className="card-body flex gap-3 items-center">
            <div style={{ padding: '0.75rem', background: '#eff6ff', color: '#2563eb', borderRadius: 12 }}>
              <Store size={24} />
            </div>
            <div>
              <div className="text-xs text-muted">Verified Active Shops</div>
              <div className="text-2xl font-bold">{reports.active_shops}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'white' }}>
          <div className="card-body flex gap-3 items-center">
            <div style={{ padding: '0.75rem', background: '#fffbeb', color: '#d97706', borderRadius: 12 }}>
              <ShoppingBag size={24} />
            </div>
            <div>
              <div className="text-xs text-muted">Total Orders Placed</div>
              <div className="text-2xl font-bold">{reports.total_orders}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Modules Quick Nav */}
      <h2 style={{ marginBottom: '1rem', color: 'var(--gray-800)', fontSize: '1.25rem' }}>Platform Operations</h2>
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card card-hover" style={{ background: 'white', cursor: 'pointer' }} onClick={() => navigate('/admin/shops')}>
          <div className="card-body">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              🏪 Verify Butcher Shops
            </h3>
            <p className="text-xs text-muted" style={{ lineHeight: 1.4, marginBottom: '1rem' }}>
              Review shop licenses, locations, and verification requests. Verify or reject shops to make them live on the marketplace.
            </p>
            <span className="btn btn-secondary btn-sm">Go to Shop Verification</span>
          </div>
        </div>

        <div className="card card-hover" style={{ background: 'white', cursor: 'pointer' }} onClick={() => navigate('/admin/market-prices')}>
          <div className="card-body">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              📈 Daily Reference Prices
            </h3>
            <p className="text-xs text-muted" style={{ lineHeight: 1.4, marginBottom: '1rem' }}>
              Set daily benchmark market reference prices for Chicken, Mutton, Fish, and Prawns to help customers make cost-effective choices.
            </p>
            <span className="btn btn-secondary btn-sm">Manage Market Prices</span>
          </div>
        </div>

        <div className="card card-hover" style={{ background: 'white', cursor: 'pointer' }} onClick={() => navigate('/admin/reports')}>
          <div className="card-body">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              📊 Analytics & Reports
            </h3>
            <p className="text-xs text-muted" style={{ lineHeight: 1.4, marginBottom: '1rem' }}>
              Deep dive into user breakdowns, order tracking status summaries, and active shop performance across various cities.
            </p>
            <span className="btn btn-secondary btn-sm">View Analytics Reports</span>
          </div>
        </div>
      </div>
    </div>
  );
}
