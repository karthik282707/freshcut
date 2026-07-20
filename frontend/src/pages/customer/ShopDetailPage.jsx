import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Star, Plus, Minus, MapPin, Clock, ChevronLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function ShopDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, cartCount } = useCart();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState({});
    const [cuttingStyles, setCuttingStyles] = useState({});
    const [toast, setToast] = useState('');

    useEffect(() => {
        Promise.all([axios.get(`/api/shops/${id}`), axios.get(`/api/catalog/shops/${id}`)])
            .then(([s, p]) => { setShop(s.data); setProducts(p.data); })
            .catch(() => navigate(-1))
            .finally(() => setLoading(false));
    }, [id]);

    const setQty = (pid, delta) => {
        setQuantities(q => ({ ...q, [pid]: Math.max(0.5, Math.min(20, (q[pid] || 1) + delta)) }));
    };

    const handleAdd = (product) => {
        const qty = quantities[product.id] || 1;
        const style = cuttingStyles[product.id] || product.cutting_styles?.[0] || 'Whole';
        addToCart({ ...product, shop_id: parseInt(id), shop_name: shop.name, quantity: qty, cutting_style: style });
        setToast(`${product.name} added to cart!`);
        setTimeout(() => setToast(''), 2500);
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;
    if (!shop) return null;

    const getPriceDiff = (p) => {
        if (!p.market_reference_price) return null;
        const diff = ((p.selling_price - p.market_reference_price) / p.market_reference_price * 100).toFixed(0);
        return parseInt(diff);
    };

    return (
        <div>
            {toast && <div className="alert alert-success" style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 300, minWidth: 260 }}>✓ {toast}</div>}

            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}>
                <ChevronLeft size={16} /> Back
            </button>

            {/* Shop header */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ height: 160, background: 'linear-gradient(135deg, #9b1c1c, #1a1010)', display: 'flex', alignItems: 'center', padding: '2rem', gap: '1.5rem' }}>
                    <div style={{ fontSize: '3.5rem' }}>🥩</div>
                    <div style={{ color: 'white' }}>
                        <h1 style={{ color: 'white', fontSize: '1.6rem' }}>{shop.name}</h1>
                        <div className="flex items-center gap-3 text-sm" style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>
                            <span className="flex items-center gap-1"><MapPin size={13} /> {shop.address}</span>
                            <span className="flex items-center gap-1"><Clock size={13} /> {shop.opens_at?.slice(0, 5)} – {shop.closes_at?.slice(0, 5)}</span>
                            <span className="flex items-center gap-1"><Star size={13} fill="#f59e0b" color="#f59e0b" /> {parseFloat(shop.rating_avg || 0).toFixed(1)} ({shop.rating_count} reviews)</span>
                        </div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => navigate('/customer/cart')} className="btn btn-primary" style={{ position: 'relative' }}>
                            <ShoppingCart size={16} /> Cart {cartCount > 0 && <span className="badge badge-red" style={{ position: 'absolute', top: -8, right: -8, minWidth: 20, height: 20, padding: '0 6px' }}>{cartCount}</span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Products */}
            {products.length === 0 && (
                <div className="empty-state"><div className="empty-state-icon">📦</div><h3>No products available</h3></div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {products.map(p => {
                    const diff = getPriceDiff(p);
                    const qty = quantities[p.id] || 1;
                    const styles = Array.isArray(p.cutting_styles) ? p.cutting_styles : JSON.parse(p.cutting_styles || '[]');
                    const selected = cuttingStyles[p.id] || styles[0] || 'Whole';
                    return (
                        <div key={p.id} className="card">
                            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--red-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                                    {p.category === 'Chicken' ? '🍗' : p.category === 'Mutton' ? '🐑' : p.category === 'Fish' ? '🐟' : '🥩'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{p.name}</h3>
                                    <div className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>
                                        <span className="badge badge-gray">{p.category}</span>
                                        <span style={{ marginLeft: '0.4rem' }}>Stock: {p.stock_qty} {p.unit}</span>
                                    </div>
                                    <div className="price-comparison">
                                        <span className="price-our">₹{p.selling_price}/{p.unit}</span>
                                        {p.market_reference_price && (
                                            <>
                                                <span className="price-market">Mkt: <span className="price-market-val">₹{p.market_reference_price}</span></span>
                                                {diff !== null && (
                                                    diff < 0
                                                        ? <span className="price-cheaper">↓ {Math.abs(diff)}% cheaper</span>
                                                        : diff > 0
                                                            ? <span className="price-expensive">↑ {diff}% above market</span>
                                                            : null
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                    <select className="form-control" style={{ width: 140, fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                                        value={selected} onChange={e => setCuttingStyles(c => ({ ...c, [p.id]: e.target.value }))}>
                                        {styles.map(s => <option key={s}>{s}</option>)}
                                    </select>

                                    <div className="qty-picker">
                                        <button className="qty-btn" onClick={() => setQty(p.id, -0.5)}><Minus size={14} /></button>
                                        <span className="qty-value text-sm">{qty} {p.unit}</span>
                                        <button className="qty-btn" onClick={() => setQty(p.id, 0.5)}><Plus size={14} /></button>
                                    </div>

                                    <button className="btn btn-primary btn-sm" onClick={() => handleAdd(p)}>
                                        <ShoppingCart size={14} /> Add ₹{(p.selling_price * qty).toFixed(0)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
