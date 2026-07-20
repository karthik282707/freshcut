import { useState, useEffect } from 'react';
import axios from 'axios';

export default function StockPage() {
    const [shop, setShop] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [edits, setEdits] = useState({});
    const [saving, setSaving] = useState({});
    const [msg, setMsg] = useState('');
    const [newProduct, setNewProduct] = useState({ name: '', category_id: '', stock_qty: '', selling_price: '', cutting_styles: [] });
    const [categories, setCategories] = useState([]);
    const [showAdd, setShowAdd] = useState(false);

    useEffect(() => {
        axios.get('/api/shops/owner/mine').then(r => {
            setShop(r.data);
            if (r.data) {
                axios.get(`/api/inventory/shop/${r.data.id}`).then(i => {
                    setInventory(i.data);
                    const e = {};
                    i.data.forEach(p => { e[p.product_id] = { stock_qty: p.stock_qty, selling_price: p.selling_price }; });
                    setEdits(e);
                });
            }
        });
        axios.get('/api/market/categories').then(r => setCategories(r.data));
    }, []);

    const save = async (product) => {
        setSaving(s => ({ ...s, [product.product_id]: true }));
        try {
            await axios.put(`/api/inventory/${product.product_id}`, {
                shop_id: shop.id,
                stock_qty: edits[product.product_id]?.stock_qty,
                selling_price: edits[product.product_id]?.selling_price,
            });
            setMsg(`✓ ${product.name} updated`);
            setTimeout(() => setMsg(''), 2000);
        } finally {
            setSaving(s => ({ ...s, [product.product_id]: false }));
        }
    };

    const addProduct = async () => {
        try {
            await axios.post('/api/inventory/products', {
                ...newProduct,
                shop_id: shop.id,
                cutting_styles: ['Whole', 'Curry Cut', 'Boneless', 'Minced'],
            });
            const r = await axios.get(`/api/inventory/shop/${shop.id}`);
            setInventory(r.data);
            const e = {};
            r.data.forEach(p => { e[p.product_id] = { stock_qty: p.stock_qty, selling_price: p.selling_price }; });
            setEdits(e);
            setShowAdd(false);
            setNewProduct({ name: '', category_id: '', stock_qty: '', selling_price: '', cutting_styles: [] });
            setMsg('✓ Product added');
        } catch (err) {
            setMsg('❌ ' + (err.response?.data?.error || 'Failed'));
        }
    };

    if (!shop) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">📦 Manage Stock</h1>
                    <p className="page-subtitle">Update daily stock quantities and prices</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Product</button>
            </div>

            {msg && <div className={`alert ${msg.startsWith('❌') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1rem' }}>{msg}</div>}

            {showAdd && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-header flex justify-between items-center">
                        <h3>Add New Product</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>✕</button>
                    </div>
                    <div className="card-body">
                        <div className="grid-3" style={{ display: 'grid', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Product Name</label>
                                <input className="form-control" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-control" value={newProduct.category_id} onChange={e => setNewProduct(p => ({ ...p, category_id: e.target.value }))}>
                                    <option value="">Select...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Initial Stock (kg)</label>
                                <input className="form-control" type="number" value={newProduct.stock_qty} onChange={e => setNewProduct(p => ({ ...p, stock_qty: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Selling Price (₹/kg)</label>
                                <input className="form-control" type="number" value={newProduct.selling_price} onChange={e => setNewProduct(p => ({ ...p, selling_price: e.target.value }))} />
                            </div>
                        </div>
                        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={addProduct}>Add Product</button>
                    </div>
                </div>
            )}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Product</th><th>Category</th><th>Stock (kg)</th><th>Price (₹/kg)</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {inventory.map(p => (
                            <tr key={p.product_id}>
                                <td><div className="font-semibold">{p.name}</div></td>
                                <td><span className="badge badge-gray">{p.category}</span></td>
                                <td>
                                    <input type="number" className="form-control" style={{ width: 90 }} min={0} step={0.5}
                                        value={edits[p.product_id]?.stock_qty ?? p.stock_qty}
                                        onChange={e => setEdits(ed => ({ ...ed, [p.product_id]: { ...ed[p.product_id], stock_qty: e.target.value } }))} />
                                </td>
                                <td>
                                    <input type="number" className="form-control" style={{ width: 110 }} min={0}
                                        value={edits[p.product_id]?.selling_price ?? p.selling_price}
                                        onChange={e => setEdits(ed => ({ ...ed, [p.product_id]: { ...ed[p.product_id], selling_price: e.target.value } }))} />
                                </td>
                                <td>
                                    <button className="btn btn-primary btn-sm" onClick={() => save(p)} disabled={saving[p.product_id]}>
                                        {saving[p.product_id] ? 'Saving…' : 'Save'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
