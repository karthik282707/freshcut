import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Star, Plus, Minus, MapPin, Clock, ChevronLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CustomerShopDetailPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [cuttingStyles, setCuttingStyles] = useState({});
  const [specialInstructions, setSpecialInstructions] = useState({});
  const [toast, setToast] = useState('');

  const fetchShopDetails = async () => {
    setLoading(true);
    try {
      const [shopRes, prodRes] = await Promise.all([
        axios.get(`/api/shops/${shopId}`),
        axios.get(`/api/shops/${shopId}/products`)
      ]);
      setShop(shopRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
      navigate('/customer/home');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopDetails();
  }, [shopId]);

  const setQty = (pid, delta, maxStock) => {
    setQuantities(q => {
      const current = q[pid] || 1.0;
      const next = Math.max(0.5, Math.min(maxStock, current + delta));
      return { ...q, [pid]: parseFloat(next.toFixed(2)) };
    });
  };

  const handleAdd = (product) => {
    const qty = quantities[product.product_id] || 1.0;
    const style = cuttingStyles[product.product_id] || 'Curry Cut';
    const instructions = specialInstructions[product.product_id] || '';

    if (qty > parseFloat(product.available_quantity_kg)) {
      alert(`Cannot order more than available stock (${product.available_quantity_kg} kg)`);
      return;
    }

    addToCart({
      id: product.product_id,
      name: product.name,
      category: product.category,
      unit: product.unit,
      selling_price: parseFloat(product.selling_price_per_kg),
      shop_id: parseInt(shopId),
      shop_name: shop.name,
      quantity: qty,
      cutting_style: style,
      special_instruction: instructions
    });

    setToast(`${product.name} added to cart!`);
    setTimeout(() => setToast(''), 2500);
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!shop) return null;

  const cuttingStyleOptions = [
    'Curry Cut',
    'Biryani Cut',
    'Boneless',
    'Whole',
    'Small Pieces',
    'Medium Pieces',
    'Large Pieces'
  ];

  return (
    <div>
      {toast && (
        <div className="alert alert-success" style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 300, minWidth: 260 }}>
          ✓ {toast}
        </div>
      )}

      <div className="page-header flex items-center justify-between">
        <button onClick={() => navigate('/customer/home')} className="btn btn-ghost btn-sm">
          <ChevronLeft size={16} /> Back to Shops
        </button>
        <button onClick={() => navigate('/customer/cart')} className="btn btn-primary" style={{ position: 'relative' }}>
          <ShoppingCart size={16} /> View Cart 
          {cartCount > 0 && (
            <span className="badge badge-red" style={{ position: 'absolute', top: -8, right: -8, minWidth: 20, height: 20, padding: '0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Shop banner */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'white' }}>
        <div className="card-body flex gap-4" style={{ padding: '2rem' }}>
          <div style={{ fontSize: '3rem', background: 'var(--red-50)', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center' }}>
            🏪
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--red-800)', marginBottom: '0.25rem' }}>{shop.name}</h1>
            <p className="text-muted text-sm" style={{ marginBottom: '0.5rem' }}>{shop.address}, {shop.city}</p>
            <div className="flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1"><Star size={12} fill="#f59e0b" color="#f59e0b" /> {parseFloat(shop.rating || 0).toFixed(1)} Rating</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {shop.delivery_time} Delivery</span>
              <span>Distance: {shop.distance}</span>
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1rem', color: 'var(--gray-800)' }}>Cut-to-Order Menu</h2>

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🥩</div>
          <h3>No products in stock</h3>
          <p>This shop hasn't updated its stock inventory for today yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {products.map(p => {
            const qty = quantities[p.product_id] || 1.0;
            const style = cuttingStyles[p.product_id] || 'Curry Cut';
            const instruction = specialInstructions[p.product_id] || '';
            const maxStock = parseFloat(p.available_quantity_kg);
            
            // Calculate comparison
            const shopPrice = parseFloat(p.selling_price_per_kg);
            const marketPrice = p.market_reference_price ? parseFloat(p.market_reference_price) : null;
            const isCheaper = marketPrice && shopPrice < marketPrice;
            const isMore = marketPrice && shopPrice > marketPrice;
            const pctDiff = marketPrice ? Math.round(Math.abs((shopPrice - marketPrice) / marketPrice) * 100) : 0;

            const meatEmoji = p.category === 'Chicken' ? '🍗' : p.category === 'Mutton' ? '🐑' : p.category === 'Fish' ? '🐟' : '🍤';

            return (
              <div key={p.product_id} className="card" style={{ background: 'white' }}>
                <div className="card-body flex justify-between items-center" style={{ gap: '2rem' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', flex: 1 }}>
                    <div style={{ 
                      width: 70, 
                      height: 70, 
                      borderRadius: 12, 
                      background: 'var(--red-50)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '2.2rem',
                      flexShrink: 0
                    }}>
                      {meatEmoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{p.name}</h3>
                        <span className="badge badge-gray text-xs">{p.category}</span>
                      </div>
                      
                      <div className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
                        Stock Available: <span className="font-semibold text-primary">{p.available_quantity_kg} {p.unit}</span>
                      </div>

                      {/* Pricing Comparison */}
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg" style={{ color: 'var(--red-700)' }}>
                          ₹{p.selling_price_per_kg}/{p.unit}
                        </span>
                        {marketPrice && (
                          <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            Market Price: <span style={{ textDecoration: 'line-through' }}>₹{marketPrice}</span>
                            {isCheaper && (
                              <span className="badge badge-green text-xs">↓ {pctDiff}% Cheaper</span>
                            )}
                            {isMore && (
                              <span className="badge badge-amber text-xs">↑ {pctDiff}% above reference</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add settings and checkout pickers */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: 220, flexShrink: 0 }}>
                    {/* Cutting Style */}
                    <div className="form-group">
                      <label className="text-xs font-semibold">Cutting Style:</label>
                      <select 
                        className="form-control" 
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.5rem' }}
                        value={style}
                        onChange={e => setCuttingStyles(c => ({ ...c, [p.product_id]: e.target.value }))}
                      >
                        {cuttingStyleOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Special Instructions */}
                    <input
                      className="form-control"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                      placeholder="Special instructions (e.g. skinless)"
                      value={instruction}
                      onChange={e => setSpecialInstructions(i => ({ ...i, [p.product_id]: e.target.value }))}
                    />

                    {/* Qty & Add to Cart */}
                    <div className="flex items-center justify-between" style={{ marginTop: '0.25rem' }}>
                      <div className="qty-picker" style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '4px', height: '32px' }}>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '0 8px', height: '100%', borderRadius: 0, border: 'none' }}
                          onClick={() => setQty(p.product_id, -0.5, maxStock)}
                          disabled={qty <= 0.5}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold" style={{ padding: '0 8px', minWidth: '50px', textAlign: 'center' }}>
                          {qty} {p.unit}
                        </span>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '0 8px', height: '100%', borderRadius: 0, border: 'none' }}
                          onClick={() => setQty(p.product_id, 0.5, maxStock)}
                          disabled={qty >= maxStock}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleAdd(p)}
                        disabled={maxStock <= 0}
                      >
                        Add (₹{(p.selling_price_per_kg * qty).toFixed(0)})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
