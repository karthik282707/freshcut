import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, ShoppingBag, Layers, Award, ClipboardList } from 'lucide-react';

export default function ButcherDashboardPage() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        axios.get('/api/butcher/dashboard'),
        axios.get('/api/butcher/orders')
      ]);
      setStats(statsRes.data);
      // Only show top 5 recent orders on dashboard
      setOrders(ordersRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load butcher dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">🥩 Shop Owner Dashboard</h1>
          <p className="page-subtitle">Manage your stock, prepare custom cuts, and track daily sales metrics</p>
        </div>
        <button onClick={() => navigate('/butcher/orders')} className="btn btn-primary btn-sm">
          Manage Orders
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'white' }}>
          <div className="card-body flex gap-3 items-center">
            <div style={{ padding: '0.75rem', background: '#ecfdf5', color: '#059669', borderRadius: 12 }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-xs text-muted">Today's Revenue</div>
              <div className="text-2xl font-bold">₹{stats.today_revenue?.toFixed(0)}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'white' }}>
          <div className="card-body flex gap-3 items-center">
            <div style={{ padding: '0.75rem', background: '#eff6ff', color: '#2563eb', borderRadius: 12 }}>
              <ShoppingBag size={24} />
            </div>
            <div>
              <div className="text-xs text-muted">Today's Orders</div>
              <div className="text-2xl font-bold">{stats.today_orders}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'white' }}>
          <div className="card-body flex gap-3 items-center">
            <div style={{ padding: '0.75rem', background: '#fffbeb', color: '#d97706', borderRadius: 12 }}>
              <Layers size={24} />
            </div>
            <div>
              <div className="text-xs text-muted">Remaining Stock</div>
              <div className="text-2xl font-bold">{stats.remaining_stock?.toFixed(1)} kg</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'white' }}>
          <div className="card-body flex gap-3 items-center">
            <div style={{ padding: '0.75rem', background: '#fdf2f8', color: '#db2777', borderRadius: 12 }}>
              <Award size={24} />
            </div>
            <div>
              <div className="text-xs text-muted">Best Seller</div>
              <div className="font-bold text-sm" style={{ marginTop: 4 }}>{stats.best_selling_product}</div>
              <div className="text-xs text-muted">({stats.best_selling_qty?.toFixed(1)} kg sold)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <h2 style={{ marginBottom: '1rem', color: 'var(--gray-800)' }}>Recent Customer Orders</h2>
      {orders.length === 0 ? (
        <div className="card" style={{ background: 'white', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
          <h3>No customer orders received yet</h3>
          <p className="text-muted text-sm">When customers place orders from your shop, they will show up here.</p>
        </div>
      ) : (
        <div className="card" style={{ background: 'white' }}>
          <div className="card-body" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem' }}>Order ID</th>
                  <th style={{ padding: '1rem' }}>Customer</th>
                  <th style={{ padding: '1rem' }}>Amount</th>
                  <th style={{ padding: '1rem' }}>Method</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Created At</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/butcher/orders')}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>#{order.id}</td>
                    <td style={{ padding: '1rem' }}>
                      <div className="font-semibold text-sm">{order.customer_name}</div>
                      <div className="text-xs text-muted">{order.customer_phone}</div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>₹{parseFloat(order.total_amount).toFixed(0)}</td>
                    <td style={{ padding: '1rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>{order.payment_method}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${
                        order.order_status === 'New' ? 'badge-amber' : 
                        order.order_status === 'Delivered' ? 'badge-green' : 
                        order.order_status === 'Cancelled' ? 'badge-red' : 'badge-blue'
                      }`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
