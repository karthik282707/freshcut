import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { ShoppingBag, MapPin, CreditCard, Trash2, ChevronRight, Store } from 'lucide-react';

export default function CustomerCartPage() {
  const { cartItems, cartTotal, shopId, updateQty, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' or 'UPI'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Please specify a delivery address');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Map cart context items to the database payload schema
      const itemsPayload = cartItems.map(item => ({
        product_id: item.id,
        quantity_kg: item.quantity,
        cutting_style: item.cutting_style,
        special_instruction: item.special_instruction || null
      }));

      const payload = {
        shop_id: shopId,
        delivery_address: address,
        payment_method: paymentMethod,
        items: itemsPayload
      };

      const { data } = await axios.post('/api/orders', payload);
      
      // Order placed successfully! Clear cart & navigate to tracking page
      clearCart();
      navigate(`/customer/orders/${data.id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: '3rem' }}>
        <div className="empty-state-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Go to the shops browser and add fresh-cut meat products to your cart!</p>
        <button onClick={() => navigate('/customer/home')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Browse Butcher Shops
        </button>
      </div>
    );
  }

  const shopName = cartItems[0]?.shop_name || 'Butcher Shop';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>🥩 Review Your Order</h1>
      
      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <div className="grid grid-3" style={{ gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
        {/* Cart items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ background: 'white' }}>
            <div className="card-header flex items-center gap-2">
              <Store size={18} color="var(--primary)" />
              <span className="font-bold text-sm">Ordering from: {shopName}</span>
            </div>
            
            <div className="card-body" style={{ padding: 0 }}>
              {cartItems.map((item, index) => (
                <div 
                  key={item.cartKey} 
                  className="flex justify-between items-center"
                  style={{ 
                    padding: '1rem', 
                    borderBottom: index === cartItems.length - 1 ? 'none' : '1px solid var(--border)' 
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs text-muted" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 4 }}>
                      <span className="badge badge-gray text-xs">{item.cutting_style}</span>
                      {item.special_instruction && (
                        <span style={{ color: 'var(--red-600)', italic: 'true' }}>
                          ✏️ "{item.special_instruction}"
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Qty edit */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '4px', height: '28px' }}>
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '0 6px', height: '100%', borderRadius: 0, border: 'none' }}
                        onClick={() => updateQty(item.cartKey, item.quantity - 0.5)}
                      >
                        -
                      </button>
                      <span style={{ padding: '0 8px', fontSize: '0.85rem', fontWeight: 600 }}>{item.quantity} kg</span>
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '0 6px', height: '100%', borderRadius: 0, border: 'none' }}
                        onClick={() => updateQty(item.cartKey, item.quantity + 0.5)}
                      >
                        +
                      </button>
                    </div>

                    {/* Price */}
                    <span className="font-semibold text-sm" style={{ minWidth: 60, textAlign: 'right' }}>
                      ₹{(item.selling_price * item.quantity).toFixed(0)}
                    </span>

                    {/* Delete */}
                    <button 
                      onClick={() => removeFromCart(item.cartKey)} 
                      style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                      className="hover-red"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div>
          <form onSubmit={handleCheckout} className="card" style={{ background: 'white', position: 'sticky', top: '1rem' }}>
            <div className="card-body">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                Summary
              </h3>
              
              <div className="flex justify-between font-semibold" style={{ marginBottom: '1.25rem' }}>
                <span>Subtotal:</span>
                <span className="text-lg text-primary">₹{cartTotal.toFixed(0)}</span>
              </div>

              {/* Address input */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label flex items-center gap-1">
                  <MapPin size={14} color="var(--primary)" /> Delivery Address
                </label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  placeholder="Enter your street name, building number, and landmark"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  required
                />
              </div>

              {/* Payment selection */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label flex items-center gap-1">
                  <CreditCard size={14} color="var(--primary)" /> Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'COD' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                    onClick={() => setPaymentMethod('COD')}
                  >
                    Cash on Delivery
                  </button>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'UPI' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                    onClick={() => setPaymentMethod('UPI')}
                  >
                    Simulated UPI
                  </button>
                </div>
                {paymentMethod === 'UPI' && (
                  <div className="alert" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '0.75rem', marginTop: '0.5rem', padding: '0.4rem 0.6rem' }}>
                    📱 UPI simulation: Will be marked as pre-paid automatically upon checkout.
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={loading}
                style={{ gap: 6 }}
              >
                {loading ? 'Processing...' : <>Place Order <ChevronRight size={16} /></>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
