import { useState, useEffect } from 'react';
import axios from 'axios';
import { Store, MapPin, Clock, FileText, CheckCircle } from 'lucide-react';

export default function ShopProfilePage() {
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        city: 'Chennai',
        opens_at: '06:00',
        closes_at: '20:00',
        latitude: '',
        longitude: ''
    });
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchShop();
    }, []);

    const fetchShop = async () => {
        try {
            const r = await axios.get('/api/shops/owner/mine');
            if (r.data) {
                setShop(r.data);
                setFormData({
                    name: r.data.name || '',
                    description: r.data.description || '',
                    address: r.data.address || '',
                    city: r.data.city || 'Chennai',
                    opens_at: r.data.opens_at ? r.data.opens_at.substring(0, 5) : '06:00',
                    closes_at: r.data.closes_at ? r.data.closes_at.substring(0, 5) : '20:00',
                    latitude: r.data.latitude || '',
                    longitude: r.data.longitude || ''
                });
            }
        } catch (err) {
            console.error('Error fetching shop', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const registerShop = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setMsg('');

        const payload = {
            ...formData,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null
        };

        try {
            const r = await axios.post('/api/shops', payload);
            setShop(r.data);
            setMsg('✓ Shop registered successfully! Waiting for admin verification.');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to register shop. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div className="page-header">
                <h1 className="page-title">🏪 Shop Profile</h1>
                <p className="page-subtitle">Manage your shop details, business hours, and operational status</p>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}
            {msg && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{msg}</div>}

            {shop ? (
                <div className="card">
                    <div className="card-header flex justify-between items-center">
                        <h3 className="card-title">Active Shop Details</h3>
                        <span className={`badge ${shop.status === 'verified' ? 'badge-green' : shop.status === 'suspended' ? 'badge-red' : 'badge-amber'}`}>
                            {shop.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="flex items-center gap-3">
                                <Store className="text-muted" size={20} />
                                <div>
                                    <div className="text-xs text-muted">Shop Name</div>
                                    <div className="font-semibold text-lg">{shop.name}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <FileText className="text-muted" size={20} />
                                <div>
                                    <div className="text-xs text-muted">Description</div>
                                    <div>{shop.description || 'No description provided.'}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <MapPin className="text-muted" size={20} />
                                <div>
                                    <div className="text-xs text-muted">Location</div>
                                    <div>{shop.address}, {shop.city}</div>
                                    {(shop.latitude && shop.longitude) && (
                                        <div className="text-xs text-muted mt-1">Coordinates: {shop.latitude}, {shop.longitude}</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Clock className="text-muted" size={20} />
                                <div>
                                    <div className="text-xs text-muted">Business Hours</div>
                                    <div>{shop.opens_at ? shop.opens_at.substring(0, 5) : '06:00'} AM - {shop.closes_at ? shop.closes_at.substring(0, 5) : '08:00'} PM</div>
                                </div>
                            </div>

                            {shop.status !== 'verified' && (
                                <div className="alert alert-warning flex items-start gap-2" style={{ marginTop: '1rem', background: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309' }}>
                                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                                    <div>
                                        <div className="font-semibold text-sm">Awaiting Verification</div>
                                        <p className="text-xs" style={{ margin: 0 }}>Your shop is currently pending approval. Once verified by an administrator, it will be visible to cutomers for orders.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Register Your Meat Shop</h3>
                    </div>
                    <form onSubmit={registerShop} className="card-body">
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                            <label className="form-label" style={{ fontWeight: 600 }}>Shop name *</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Rajan Premium Fresh Meats"
                                className="form-control"
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                            <label className="form-label" style={{ fontWeight: 600 }}>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your specialty cuts, sourcing details, etc."
                                className="form-control"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>City *</label>
                                <select
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="form-control"
                                >
                                    <option value="Chennai">Chennai</option>
                                    <option value="Mumbai">Mumbai</option>
                                    <option value="Bangalore">Bangalore</option>
                                    <option value="Delhi">Delhi</option>
                                    <option value="Hyderabad">Hyderabad</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>Full Address *</label>
                                <input
                                    type="text"
                                    name="address"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Door no, Street name, Area"
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <div className="grid grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>Opens At</label>
                                <input
                                    type="time"
                                    name="opens_at"
                                    value={formData.opens_at}
                                    onChange={handleChange}
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>Closes At</label>
                                <input
                                    type="time"
                                    name="closes_at"
                                    value={formData.closes_at}
                                    onChange={handleChange}
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <div className="grid grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>Latitude (optional)</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    name="latitude"
                                    value={formData.latitude}
                                    onChange={handleChange}
                                    placeholder="e.g. 13.0827"
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>Longitude (optional)</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    name="longitude"
                                    value={formData.longitude}
                                    onChange={handleChange}
                                    placeholder="e.g. 80.2707"
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary btn-lg w-full"
                            style={{ width: '100%' }}
                        >
                            {saving ? 'Registering Shop...' : 'Register Shop'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
