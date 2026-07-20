import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ClipboardList, MapPin, Store, CheckCircle, RefreshCw } from 'lucide-react';

export default function CustomerOrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrderDetails = async () => {
    try {
      const { data } = await axios.get(`/api/orders/${orderId}`);
      setOrder(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load order tracking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    
    // Set up auto-polling for prototype status updates every 5 seconds
    const interval = setInterval(fetchOrderDetails, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error || !order) return <div className="alert alert-error">{error || 'Order not found'}</div>;

  const trackingStages = ['New', 'Accepted', 'Cutting Meat', 'Packed', 'Out for Delivery', 'Delivered'];
  const currentStageIndex = trackingStages.indexOf(order.order_status);
  const isCancelled = order.order_status === 'Cancelled';

  const getStageStyle = (index) => {
    if (isCancelled) return 'stage-muted';
    if (index === currentStageIndex) return 'stage-active'; // Pulsing active state
    if (index < currentStageIndex) return 'stage-completed';
    return 'stage-pending';
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header flex items-center justify-between">
        <button onClick={() => navigate('/customer/orders')} className="btn btn-ghost btn-sm">
          <ChevronLeft size={16} /> Back to Orders
        </button>
        <button onClick={fetchOrderDetails} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
          <RefreshCw size={14} /> Refresh Status
        </button>
      </div>

      <div className="card" style={{ background: 'white', marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order ID</span>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--red-800)' }}>#{order.id}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="text-xs text-muted">Status</span>
              <div style={{ marginTop: 4 }}>
                <span className={`badge ${isCancelled ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                  {order.order_status}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Tracking Progress */}
          {isCancelled ? (
            <div className="alert alert-error" style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              <h3>🚫 Order Cancelled / Rejected</h3>
              <p style={{ marginTop: '0.5rem' }}>This order was rejected by the butcher shop or cancelled.</p>
            </div>
          ) : (
            <div style={{ marginBottom: '2.5rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Tracking Timeline</h4>
              
              {/* Timeline Steps Layout */}
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '1rem 0' }}>
                {/* Connecting bar */}
                <div style={{
                  position: 'absolute', top: '2.25rem', left: '8%', right: '8%', height: '4px',
                  background: 'var(--border)', zIndex: 1
                }} />
                {/* Active connection progress */}
                <div style={{
                  position: 'absolute', top: '2.25rem', left: '8%',
                  width: `${(currentStageIndex / (trackingStages.length - 1)) * 84}%`,
                  height: '4px', background: 'var(--green-500)', zIndex: 2,
                  transition: 'width 0.4s ease'
                }} />

                {trackingStages.map((stage, idx) => {
                  const stageStyle = getStageStyle(idx);
                  let icon = '⚪';
                  let color = 'var(--gray-400)';
                  let border = '2px solid var(--border)';
                  let bg = 'white';

                  if (stageStyle === 'stage-completed') {
                    icon = '✓';
                    color = 'white';
                    bg = 'var(--green-500)';
                    border = '2px solid var(--green-500)';
                  } else if (stageStyle === 'stage-active') {
                    icon = '⏳';
                    color = 'white';
                    bg = 'var(--primary)';
                    border = '2px solid var(--primary)';
                  }

                  return (
                    <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '15%', zIndex: 3, textAlign: 'center' }}>
                      <div style={{
                        width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                        background: bg, border: border, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: color, fontWeight: 'bold', fontSize: '0.9rem',
                        marginBottom: '0.5rem', boxShadow: stageStyle === 'stage-active' ? '0 0 10px rgba(201,55,42,0.5)' : 'none'
                      }}>
                        {icon}
                      </div>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: stageStyle === 'stage-active' ? 700 : 500,
                        color: stageStyle === 'stage-active' ? 'var(--primary)' : 'var(--text-primary)'
                      }}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details breakdown */}
          <div className="grid grid-3" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div>
              <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ClipboardList size={16} /> Prepared Items
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center" style={{ background: 'var(--gray-50)', padding: '0.75rem', borderRadius: 8 }}>
                    <div>
                      <div className="font-semibold text-sm">{item.product_name}</div>
                      <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                        Style: <span className="font-semibold">{item.cutting_style}</span>
                        {item.special_instruction && (
                          <span style={{ marginLeft: 8, color: 'var(--primary)' }}>
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

            <div>
              <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Store size={16} /> Butcher Shop
              </h4>
              <p className="text-sm font-semibold" style={{ color: 'var(--red-800)' }}>{order.shop_name}</p>
              <p className="text-xs text-muted" style={{ marginBottom: '1rem' }}>{order.shop_address}</p>

              <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={16} /> Delivery Address
              </h4>
              <p className="text-xs text-muted" style={{ marginBottom: '1rem', lineHeight: 1.4 }}>{order.delivery_address}</p>

              <div style={{ background: 'var(--red-50)', padding: '1rem', borderRadius: 8, marginTop: '1.5rem' }}>
                <div className="flex justify-between text-sm" style={{ marginBottom: '0.4rem' }}>
                  <span>Payment Method:</span>
                  <span className="font-semibold">{order.payment_method}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ marginBottom: '0.4rem' }}>
                  <span>Payment Status:</span>
                  <span className="font-semibold text-green-500">{order.payment_status}</span>
                </div>
                <div className="flex justify-between font-bold text-lg" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <span>Total paid:</span>
                  <span>₹{parseFloat(order.total_amount).toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
