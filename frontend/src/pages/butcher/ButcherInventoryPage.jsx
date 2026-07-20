import { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Plus, Save, Edit, X, RefreshCw, Info } from 'lucide-react';

export default function ButcherInventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Adding product state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addQty, setAddQty] = useState(10.0);
  const [addPrice, setAddPrice] = useState(200.0);

  const fetchInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/api/butcher/inventory');
      setInventory(data.inventory);
      setAvailableProducts(data.available_to_add);
      if (data.available_to_add.length > 0) {
        setSelectedProductId(data.available_to_add[0].product_id);
      } else {
        setSelectedProductId('');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load inventory details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleEditStart = (item) => {
    setEditingId(item.inventory_id);
    setEditQty(item.available_quantity_kg);
    setEditPrice(item.selling_price_per_kg);
  };

  const handleEditSave = async (inventoryId) => {
    if (editQty === '' || editPrice === '' || parseFloat(editQty) < 0 || parseFloat(editPrice) < 0) {
      alert('Values must be non-negative numbers');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await axios.put(`/api/butcher/inventory/${inventoryId}`, {
        available_quantity_kg: parseFloat(editQty),
        selling_price_per_kg: parseFloat(editPrice)
      });
      setSuccess('Inventory updated successfully!');
      setEditingId(null);
      fetchInventory();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update stock');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return;
    if (addQty < 0 || addPrice < 0) {
      alert('Values must be non-negative');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/butcher/inventory', {
        product_id: parseInt(selectedProductId),
        available_quantity_kg: parseFloat(addQty),
        selling_price_per_kg: parseFloat(addPrice)
      });
      setSuccess('Product added to inventory menu!');
      fetchInventory();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to add product');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">📦 Manage Shop Inventory</h1>
          <p className="page-subtitle">Update your daily stock availability and customize your selling prices</p>
        </div>
        <button onClick={fetchInventory} className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
          <RefreshCw size={14} /> Refresh Menu
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      <div className="grid grid-3" style={{ gridTemplateColumns: '1.9fr 1.1fr', gap: '1.5rem' }}>
        
        {/* Inventory List */}
        <div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--gray-800)', fontSize: '1.25rem' }}>Current Inventory Stock</h2>
          {inventory.length === 0 ? (
            <div className="card" style={{ background: 'white', padding: '3rem', textAlign: 'center' }}>
              <Layers size={48} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
              <h3>Your menu is empty</h3>
              <p className="text-muted text-sm">Add meat products to your inventory from the side panel to start taking orders.</p>
            </div>
          ) : (
            <div className="card" style={{ background: 'white' }}>
              <div className="card-body" style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Product</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Stock Qty</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Your Price</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Market Price</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => {
                      const isEditing = editingId === item.inventory_id;
                      
                      const ourPrice = parseFloat(item.selling_price_per_kg);
                      const refPrice = item.market_reference_price ? parseFloat(item.market_reference_price) : null;
                      const pctDiff = refPrice ? Math.round(Math.abs((ourPrice - refPrice) / refPrice) * 100) : 0;
                      const isCheaper = refPrice && ourPrice < refPrice;
                      const isMore = refPrice && ourPrice > refPrice;

                      return (
                        <tr key={item.inventory_id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div className="font-semibold text-sm">{item.name}</div>
                            <span className="badge badge-gray text-xs">{item.category}</span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {isEditing ? (
                              <input
                                className="form-control"
                                style={{ width: '80px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                type="number"
                                step="0.5"
                                value={editQty}
                                onChange={e => setEditQty(e.target.value)}
                              />
                            ) : (
                              <span className="font-semibold">{item.available_quantity_kg} {item.unit}</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <span>₹</span>
                                <input
                                  className="form-control"
                                  style={{ width: '80px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                  type="number"
                                  value={editPrice}
                                  onChange={e => setEditPrice(e.target.value)}
                                />
                              </div>
                            ) : (
                              <span className="font-semibold text-primary">₹{item.selling_price_per_kg}/{item.unit}</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                            {refPrice ? (
                              <div>
                                <span className="font-semibold">₹{refPrice}</span>
                                <div style={{ marginTop: 2 }}>
                                  {isCheaper && <span className="badge badge-green text-xs">↓ {pctDiff}% lower</span>}
                                  {isMore && <span className="badge badge-amber text-xs">↑ {pctDiff}% above</span>}
                                  {pctDiff === 0 && <span className="text-xs text-muted">Equal to mkt</span>}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted">Not Set</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            {isEditing ? (
                              <div className="flex gap-1 justify-end">
                                <button 
                                  onClick={() => handleEditSave(item.inventory_id)} 
                                  className="btn btn-success btn-sm btn-icon"
                                  title="Save Changes"
                                >
                                  <Save size={14} />
                                </button>
                                <button 
                                  onClick={() => setEditingId(null)} 
                                  className="btn btn-ghost btn-sm btn-icon"
                                  title="Cancel"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleEditStart(item)} 
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.4rem 0.6rem' }}
                              >
                                <Edit size={12} /> Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Add Product side panel */}
        <div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--gray-800)', fontSize: '1.25rem' }}>Add Product to Menu</h2>
          <div className="card" style={{ background: 'white' }}>
            <div className="card-body">
              {availableProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Info size={24} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                  <p className="text-xs text-muted">All available system products are already added to your shop inventory!</p>
                </div>
              ) : (
                <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Select Product</label>
                    <select
                      className="form-control"
                      value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
                    >
                      {availableProducts.map(p => (
                        <option key={p.product_id} value={p.product_id}>
                          {p.name} [{p.category}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Stock Quantity (kg)</label>
                    <input
                      className="form-control"
                      type="number"
                      step="0.5"
                      value={addQty}
                      onChange={e => setAddQty(parseFloat(e.target.value))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Selling Price (₹ per kg)</label>
                    <input
                      className="form-control"
                      type="number"
                      value={addPrice}
                      onChange={e => setAddPrice(parseFloat(e.target.value))}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-full" style={{ gap: 4 }}>
                    <Plus size={16} /> Add to Shop Menu
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
