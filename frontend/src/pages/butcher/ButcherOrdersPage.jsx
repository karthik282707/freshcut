import { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardCheck, Phone, MapPin, Check, X, RefreshCw } from 'lucide-react';

export default function ButcherOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/api/butcher/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load shop orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrderItems = async (orderId) => {
    try {
      const { data } = await axios.get(`/api/orders/${orderId}`);
      setOrderDetails(prev => ({ ...prev, [orderId]: data }));
    } catch (err) {
      console.error('Error fetching order details:', err);
    }
  };

  const toggleExpand = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      if (!orderDetails[orderId]) {
        fetchOrderItems(orderId);
      }
    }
  };

  const handleAccept = async (orderId) => {
    setError(''); setSuccess('');
    try {
      await axios.put(`/api/butcher/orders/${orderId}/accept`);
      setSuccess(`Order #${orderId} accepted successfully and stock deducted!`);
      fetchOrders();
      // Reload details if expanded
      fetchOrderItems(orderId);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to accept order.');
    }
  };

  const handleReject = async (orderId) => {
    if (!window.confirm(`Are you sure you want to reject Order #${orderId}?`)) return;
    setError(''); setSuccess('');
    try {
      await axios.put(`/api/butcher/orders/${orderId}/reject`);
      setSuccess(`Order #${orderId} was rejected/cancelled.`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      setError('Failed to reject order.');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setError(''); setSuccess('');
    try {
      await axios.put(`/api/butcher/orders/${orderId}/status`, { status: newStatus });
      setSuccess(`Order #${orderId} status updated to ${newStatus}!`);
      fetchOrders();
      fetchOrderItems(orderId);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update order status.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'badge-amber';
      case 'Accepted': return 'badge-blue';
      case 'Cutting Meat': return 'badge-purple';
      case 'Packed': return 'badge-yellow';
      case 'Out for Delivery': return 'badge-orange';
      case 'Delivered': return 'badge-green';
      case 'Cancelled': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">📋 Customer Orders</h1>
          <p className="page-subtitle">Track orders, manage cutting preparation stages, and fulfill cut-to-order requests</p>
        </div>
        <button onClick={fetchOrders} className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
          <RefreshCw size={14} /> Refresh List
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      {loading && orders.length === 0 && <div className="loading-center"><div className="spinner" /></div>}

      {!loading && orders.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <div className="empty-state-icon">🏪</div>
          <h3>No orders received</h3>
          <p>Orders will show up here once customers place orders from your shop.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => {
            const isExpanded = expandedOrderId === order.id;
            const detailed = orderDetails[order.id];

            return (
              <div key={order.id} className="card" style={{ background: 'white' }}>
                {/* Header row */}
                <div 
                  className="card-body flex justify-between items-center" 
                  style={{ 
                    cursor: 'pointer', 
                    flexWrap: 'wrap', 
                    gap: '1rem',
                    borderBottom: isExpanded ? '1px solid var(--border)' : 'none'
                  }}
                  onClick={() => toggleExpand(order.id)}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div className="flex items-center gap-3" style={{ marginBottom: '0.4rem' }}>
                      <span className="font-bold text-sm">Order #{order.id}</span>
                      <span className={`badge ${getStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </div>
                    <div className="text-sm font-semibold">{order.customer_name}</div>
                    <div className="text-xs text-muted">
                      📅 Date: {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ minWidth: 150 }}>
                    <div className="text-xs text-muted">Address</div>
                    <div className="text-xs font-semibold truncate" style={{ maxWidth: 200 }}>{order.delivery_address}</div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: 100 }}>
                    <div className="text-xs text-muted">Amount</div>
                    <div className="font-bold text-sm text-primary">₹{parseFloat(order.total_amount).toFixed(0)}</div>
                    <div className="text-xs font-semibold text-muted uppercase">
                      {order.payment_method}
                    </div>
                  </div>

                  {/* Actions based on status */}
                  <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                    {order.order_status === 'New' && (
                      <>
                        <button 
                          onClick={() => handleAccept(order.id)} 
                          className="btn btn-success btn-sm"
                          style={{ gap: 2 }}
                        >
                          <Check size={14} /> Accept
                        </button>
                        <button 
                          onClick={() => handleReject(order.id)} 
                          className="btn btn-danger btn-sm"
                          style={{ gap: 2 }}
                        >
                          <X size={14} /> Reject
                        </button>
                      </>
                    )}

                    {order.order_status !== 'New' && order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">Move to:</span>
                        <select 
                          className="form-control"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.5rem', width: 140 }}
                          value={order.order_status}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                        >
                          {/* Only show future steps from current step */}
                          {['Accepted', 'Cutting Meat', 'Packed', 'Out for Delivery', 'Delivered'].map((step, idx) => {
                            const steps = ['Accepted', 'Cutting Meat', 'Packed', 'Out for Delivery', 'Delivered'];
                            const curIdx = steps.indexOf(order.order_status);
                            if (idx >= curIdx) {
                              return <option key={step} value={step}>{step}</option>;
                            }
                            return null;
                          })}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="card-body" style={{ background: 'var(--gray-50)', padding: '1.25rem' }}>
                    {!detailed ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="spinner" style={{ width: 20, height: 20 }} />
                      </div>
                    ) : (
                      <div>
                        <div className="grid grid-3" style={{ gridTemplateColumns: '1.5fr 1.5fr', gap: '1.5rem', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              Customer Information
                            </h4>
                            <div className="text-sm flex items-center gap-2" style={{ marginBottom: 4 }}>
                              <strong>{detailed.customer_name}</strong>
                            </div>
                            <div className="text-sm flex items-center gap-2" style={{ marginBottom: 4 }}>
                              <Phone size={12} /> {detailed.customer_phone}
                            </div>
                            <div className="text-sm flex items-center gap-2">
                              <MapPin size={12} /> {detailed.delivery_address}
                            </div>
                          </div>

                          <div>
                            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              Order Details
                            </h4>
                            <div className="text-sm" style={{ marginBottom: 4 }}>
                              Payment Status: <span className="font-semibold">{detailed.payment_status?.toUpperCase()}</span>
                            </div>
                            <div className="text-sm" style={{ marginBottom: 4 }}>
                              Payment Method: <span className="font-semibold">{detailed.payment_method?.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>

                        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          Ordered Custom Cuts
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {detailed.items?.map(item => (
                            <div key={item.id} className="flex justify-between items-center" style={{ background: 'white', padding: '0.75rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                              <div>
                                <span className="font-semibold text-sm">{item.product_name}</span>
                                <span className="badge badge-gray text-xs" style={{ marginLeft: 6 }}>{item.category}</span>
                                <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                                  Cutting Style: <span className="font-semibold text-primary">{item.cutting_style}</span>
                                  {item.special_instruction && (
                                    <span style={{ marginLeft: 10, color: 'var(--red-600)', fontWeight: 500 }}>
                                      ✏️ "{item.special_instruction}"
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div className="text-xs font-semibold">{item.quantity_kg} kg @ ₹{item.price_per_kg}/kg</div>
                                <div className="text-sm font-bold">₹{(item.quantity_kg * item.price_per_kg).toFixed(0)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
