import { useState, useEffect } from 'react';
import axios from 'axios';

export default function PricingPage() {
    const [shop, setShop] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [marketPrices, setMarketPrices] = useState({});
    const [edits, setEdits] = useState({});
    const [saving, setSaving] = useState({});
    const [msg, setMsg] = useState('');

    useEffect(() => {
        axios.get('/api/shops/owner/mine').then(r => {
            setShop(r.data);
            if (r.data) axios.get(`/api/inventory/shop/${r.data.id}`).then(i => {
                setInventory(i.data);
                const e = {};
                i.data.forEach(p => { e[p.product_id] = p.selling_price; });
                setEdits(e);
            });
        });
        axios.get('/api/market').then(r => {
            const mp = {};
            r.data.forEach(m => { mp[m.category_name] = m.reference_price; });
            setMarketPrices(mp);
        });
    }, []);

    const save = async (p) => {
        setSaving(s => ({ ...s, [p.product_id]: true }));
        try {
            await axios.put(`/api/inventory/${p.product_id}`, { shop_id: shop.id, stock_qty: p.stock_qty, selling_price: edits[p.product_id] });
            setMsg(`✓ ${p.name} price updated`);
            setTimeout(() => setMsg(''), 2000);
        } finally {
            setSaving(s => ({ ...s, [p.product_id]: false }));
        }
    };

    if (!shop) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">💵 Daily Pricing</h1>
                <p className="page-subtitle">Set your selling prices — market reference prices shown for comparison</p>
            </div>
            {msg && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{msg}</div>}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Product</th><th>Category</th><th>Market Price (₹/kg)</th><th>Your Price (₹/kg)</th><th>Difference</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        {inventory.map(p => {
                            const market = marketPrices[p.category];
                            const myPrice = parseFloat(edits[p.product_id] || p.selling_price);
                            const diff = market ? ((myPrice - market) / market * 100).toFixed(0) : null;
                            return (
                                <tr key={p.product_id}>
                                    <td><div className="font-semibold">{p.name}</div></td>
                                    <td><span className="badge badge-gray">{p.category}</span></td>
                                    <td>{market ? <span className="font-semibold">₹{market}</span> : <span className="text-muted">—</span>}</td>
                                    <td>
                                        <input type="number" className="form-control" style={{ width: 110 }} min={0}
                                            value={edits[p.product_id] ?? p.selling_price}
                                            onChange={e => setEdits(ed => ({ ...ed, [p.product_id]: e.target.value }))} />
                                    </td>
                                    <td>
                                        {diff !== null ? (
                                            <span className={parseInt(diff) < 0 ? 'price-cheaper' : parseInt(diff) > 0 ? 'price-expensive' : ''}>
                                                {diff > 0 ? `+${diff}%` : `${diff}%`}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        <button className="btn btn-primary btn-sm" onClick={() => save(p)} disabled={saving[p.product_id]}>
                                            {saving[p.product_id] ? '…' : 'Save'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
