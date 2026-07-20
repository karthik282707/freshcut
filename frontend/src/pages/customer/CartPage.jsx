import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

export default function CartPage() {
    const { cartItems, shopId, updateQty, removeFromCart, clearCart, cartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('Chennai');
    const [payMethod, setPayMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const deliveryFee = 30;

    const placeOrder = async () => {
        if (!address.trim()) { setError('Please enter delivery address'); return; }
        setLoading(true); setError('');
        try {
            const { data } = await axios.post('/api/orders', {
                shop_id: shopId,
                items: cartItems.map(i => ({ product_id: i.id, quantity: i.quantity, cutting_style: i.cutting_style })),
                delivery_address: address,
                delivery_city: city,
                payment_method: payMethod,
            });
            // Process payment
            await axios.post('/api/payment/process', { order_id: data.id, method: payMethod });
            clearCart();
            navigate(`/customer/orders/${data.id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) return (
        <div className="empty-state" style={{ paddingTop: '4rem' }}>
            <div className="empty-state-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p style={{ marginBottom: '1.5rem' }}>Browse shops and add items to your cart</p>
            <button className="btn btn-primary" onClick={() => navigate('/customer/shops')}>Browse Shops</button>
        </div>
    );

    return (
        <div>
            <h1 className="page-title" style={{ marginBottom: '1.5rem' }}><ShoppingCart size={24} style={{ display: 'inline', marginRight: 8 }} />My Cart</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {cartItems.map(item => (
                        <div key={item.cartKey} className="card">
                            <div className="card-body flex items-center gap-4">
                                <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--red-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>
                                    🥩
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '0.95rem' }}>{item.name}</h4>
                                    <p className="text-sm text-muted">{item.cutting_style} · ₹{item.selling_price}/{item.unit}</p>
                                </div>
                                <div className="qty-picker">
                                    <button className="qty-btn" onClick={() => updateQty(item.cartKey, item.quantity - 0.5)}><Minus size={13} /></button>
                                    <span className="qty-value text-sm">{item.quantity}</span>
                                    <button className="qty-btn" onClick={() => updateQty(item.cartKey, item.quantity + 0.5)}><Plus size={13} /></button>
                                </div>
                                <div style={{ minWidth: 80, textAlign: 'right', fontWeight: 700 }}>₹{(item.selling_price * item.quantity).toFixed(0)}</div>
                                <button className="btn btn-icon" onClick={() => removeFromCart(item.cartKey)} style={{ color: '#dc2626' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Checkout */}
                <div className="card">
                    <div className="card-header"><h3>Order Summary</h3></div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {error && <div className="alert alert-error">{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Delivery Address</label>
                            <textarea className="form-control" rows={3} value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter full delivery address..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">City</label>
                            <select className="form-control" value={city} onChange={e => setCity(e.target.value)}>
                                {['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Kolkata'].map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Payment Method</label>
                            <select className="form-control" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                                <option value="cod">Cash on Delivery</option>
                                <option value="upi">UPI (Mock)</option>
                                <option value="card">Card (Mock)</option>
                            </select>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                            <div className="flex justify-between text-sm" style={{ marginBottom: '0.5rem' }}>
                                <span className="text-muted">Subtotal</span><span>₹{cartTotal.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between text-sm" style={{ marginBottom: '0.75rem' }}>
                                <span className="text-muted">Delivery fee</span><span>₹{deliveryFee}</span>
                            </div>
                            <div className="flex justify-between font-bold" style={{ fontSize: '1.1rem' }}>
                                <span>Total</span><span style={{ color: 'var(--primary)' }}>₹{(cartTotal + deliveryFee).toFixed(0)}</span>
                            </div>
                        </div>

                        <button className="btn btn-primary btn-lg btn-full" onClick={placeOrder} disabled={loading}>
                            {loading ? 'Placing order…' : '🛒 Place Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
