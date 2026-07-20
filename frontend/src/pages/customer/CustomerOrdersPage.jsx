import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, MessageSquare, ClipboardList, Eye } from 'lucide-react';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Review modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/orders/my-orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load orders history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openReviewModal = (order) => {
    setSelectedOrder(order);
    setRating(5);
    setComment('');
    setSubmitError('');
    setSubmitSuccess('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await axios.post('/api/reviews', {
        order_id: selectedOrder.id,
        rating,
        comment
      });
      setSubmitSuccess('Review submitted successfully!');
      setTimeout(() => {
        setSelectedOrder(null);
        fetchOrders();
      }, 1500);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit review');
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
    <div style={{ maxWidth: 850, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">📋 My Meat Orders</h1>
        <p className="page-subtitle">Track your active custom cuts or view your order history</p>
      </div>

      {loading && <div className="loading-center"><div className="spinner" /></div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No orders placed yet</h3>
          <p>Once you place orders from local shops, they will appear here!</p>
          <button onClick={() => navigate('/customer/home')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Shop Fresh Meat
          </button>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => (
            <div key={order.id} className="card" style={{ background: 'white' }}>
              <div className="card-body flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div className="flex items-center gap-3" style={{ marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>Order #{order.id}</span>
                    <span className={`badge ${getStatusColor(order.order_status)}`}>
                      {order.order_status}
                    </span>
                  </div>

                  <div className="text-sm font-semibold" style={{ marginBottom: '0.25rem', color: 'var(--gray-800)' }}>
                    🏪 {order.shop_name}
                  </div>
                  
                  <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>
                    📅 Ordered on: {new Date(order.created_at).toLocaleString()}
                  </div>
                  
                  <div className="text-xs text-muted">
                    📍 Delivery to: {order.delivery_address}
                  </div>
                </div>

                <div className="flex items-center gap-4" style={{ flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-xs text-muted">Total Amount</div>
                    <div className="font-bold text-lg text-primary">₹{parseFloat(order.total_amount).toFixed(0)}</div>
                    <div className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase' }}>
                      {order.payment_method} ({order.payment_status})
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/customer/orders/${order.id}`)}
                      className="btn btn-ghost btn-sm"
                      style={{ gap: 4 }}
                    >
                      <Eye size={14} /> Track
                    </button>

                    {order.order_status === 'Delivered' && (
                      <button
                        onClick={() => openReviewModal(order)}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: 4 }}
                      >
                        <Star size={14} /> Rate Shop
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal Dialog */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', background: 'white' }}>
            <div className="card-header flex items-center justify-between">
              <h3 style={{ margin: 0 }}>Submit Feedback</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div className="card-body">
              <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                Rate your order from <strong>{selectedOrder.shop_name}</strong> (Order #{selectedOrder.id})
              </p>

              {submitError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{submitError}</div>}
              {submitSuccess && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{submitSuccess}</div>}

              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Rating (1 to 5 Stars)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.75rem' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        onClick={() => setRating(star)}
                      >
                        <Star 
                          size={28} 
                          fill={star <= rating ? '#f59e0b' : 'none'} 
                          color={star <= rating ? '#f59e0b' : '#d4d4d8'} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Review Comment</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Tell other users how fresh the meat was, and if the cutting style was prepared as requested..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-full"
                  disabled={!!submitSuccess}
                >
                  Submit Review
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
