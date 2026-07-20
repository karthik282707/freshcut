import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, Users, Store, CheckCircle, Clock } from 'lucide-react';

export default function AdminReportsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
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
  if (error || !reports) return <div className="alert alert-error">{error || 'Error loading reports'}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📊 Platform Analytics & Reports</h1>
        <p className="page-subtitle">Examine marketplace activity indicators, vendor counts, and fulfillment progress</p>
      </div>

      {/* KPI Blocks */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'white' }}>
          <div className="card-body">
            <div className="text-xs text-muted font-semibold uppercase">Total Sales Volume</div>
            <div className="text-3xl font-bold text-primary" style={{ marginTop: 6 }}>₹{reports.total_sales?.toLocaleString()}</div>
            <div className="text-xs text-muted" style={{ marginTop: 6 }}>From all successfully Delivered orders</div>
          </div>
        </div>

        <div className="card" style={{ background: 'white' }}>
          <div className="card-body">
            <div className="text-xs text-muted font-semibold uppercase">Platform Verified Shops</div>
            <div className="text-3xl font-bold" style={{ marginTop: 6, color: 'var(--green-500)' }}>{reports.active_shops}</div>
            <div className="text-xs text-muted" style={{ marginTop: 6 }}>Shops active on customer listings</div>
          </div>
        </div>

        <div className="card" style={{ background: 'white' }}>
          <div className="card-body">
            <div className="text-xs text-muted font-semibold uppercase">Total Orders</div>
            <div className="text-3xl font-bold" style={{ marginTop: 6, color: '#3b82f6' }}>{reports.total_orders}</div>
            <div className="text-xs text-muted" style={{ marginTop: 6 }}>Placed by registered customers</div>
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        
        {/* Users Breakdown */}
        <div className="card" style={{ background: 'white' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}><Users size={16} /> User Roles Breakdown</h3>
          </div>
          <div className="card-body">
            {reports.users_breakdown?.map(item => (
              <div key={item.role} className="flex justify-between items-center" style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                <span className="font-semibold text-sm capitalize">{item.role}s</span>
                <span className="badge badge-gray font-bold text-sm" style={{ minWidth: 40, textAlign: 'center' }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shops Status Breakdown */}
        <div className="card" style={{ background: 'white' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}><Store size={16} /> Shop Verification Status</h3>
          </div>
          <div className="card-body">
            {reports.shops_breakdown?.map(item => (
              <div key={item.status} className="flex justify-between items-center" style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                <span className="font-semibold text-sm capitalize">{item.status}</span>
                <span className={`badge ${
                  item.status === 'verified' ? 'badge-green' : 
                  item.status === 'pending' ? 'badge-amber' : 'badge-red'
                }`} style={{ minWidth: 40, textAlign: 'center' }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Status Breakdown */}
        <div className="card" style={{ background: 'white' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={16} /> Fulfillment Pipeline</h3>
          </div>
          <div className="card-body">
            {reports.orders_breakdown?.map(item => (
              <div key={item.status} className="flex justify-between items-center" style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                <span className="font-semibold text-sm">{item.status}</span>
                <span className={`badge ${
                  item.status === 'Delivered' ? 'badge-green' :
                  item.status === 'New' ? 'badge-amber' :
                  item.status === 'Cancelled' ? 'badge-red' : 'badge-blue'
                }`} style={{ minWidth: 40, textAlign: 'center' }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
