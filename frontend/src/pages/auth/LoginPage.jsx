import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Store, ShieldCheck, ChevronRight, Eye, EyeOff } from 'lucide-react';

const roles = [
    { id: 'customer', label: 'Customer', icon: User, desc: 'Order fresh meat from nearby shops', color: '#c9372a' },
    { id: 'butcher', label: 'Shop Owner', icon: Store, desc: 'Manage your butcher shop & orders', color: '#b45309' },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, desc: 'Manage the entire platform', color: '#1d4ed8' },
];

const DEMO = {
    customer: { email: 'customer@freshcut.com', password: 'password123' },
    butcher: { email: 'butcher@freshcut.com', password: 'password123' },
    admin: { email: 'admin@freshcut.com', password: 'password123' },
};

export default function LoginPage() {
    const [selected, setSelected] = useState('customer');
    const [email, setEmail] = useState(DEMO.customer.email);
    const [password, setPassword] = useState(DEMO.customer.password);
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const selectRole = (roleId) => {
        setSelected(roleId);
        setEmail(DEMO[roleId].email);
        setPassword(DEMO[roleId].password);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const user = await login(email, password);
            const map = { customer: '/customer/home', butcher: '/butcher/dashboard', admin: '/admin/dashboard' };
            navigate(map[user.role] || '/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #1a1010 0%, #3d1f1f 50%, #7b1414 100%)' }}>
            {/* Left panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 3rem', maxWidth: 520 }}>
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '2.5rem' }}>🥩</span>
                        <div>
                            <div style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800 }}>FreshCut Connect</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Premium Local Meat Marketplace</div>
                        </div>
                    </div>
                    <h1 style={{ color: 'white', fontSize: '2.25rem', fontWeight: 300, lineHeight: 1.2 }}>
                        Fresh meat,<br /><span style={{ fontWeight: 800, color: '#f06040' }}>cut to order.</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '1rem', lineHeight: 1.7 }}>
                        Connect with verified local butchers. Choose your cut style, specify quantities in kg, and get freshly prepared meat at your doorstep.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    {roles.map(({ id, label, icon: Icon, desc, color }) => (
                        <button
                            key={id} onClick={() => selectRole(id)}
                            style={{
                                background: selected === id ? `${color}25` : 'rgba(255,255,255,0.05)',
                                border: `1.5px solid ${selected === id ? color : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: 12, padding: '1rem', textAlign: 'left', color: 'white',
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}
                        >
                            <Icon size={22} color={color} style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{label}</div>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: 3, lineHeight: 1.3 }}>{desc}</div>
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Features</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', lineHeight: 1.8 }}>
                        ✓ Choose Curry Cut, Biryani Cut, Boneless & more<br />
                        ✓ Compare shop price vs admin market reference<br />
                        ✓ COD or simulated UPI checkout<br />
                        ✓ Real-time order tracking (New → Delivered)
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div className="card" style={{ maxWidth: 420, width: '100%', borderRadius: 20, overflow: 'visible' }}>
                    <div className="card-body" style={{ padding: '2.5rem' }}>
                        <h2 style={{ marginBottom: '0.25rem' }}>Welcome back</h2>
                        <p className="text-muted text-sm" style={{ marginBottom: '1.75rem' }}>Sign in as <strong style={{ color: '#c9372a' }}>{roles.find(r => r.id === selected)?.label}</strong></p>

                        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input className="form-control" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: '2.5rem' }} />
                                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="alert" style={{ background: '#fff8f5', border: '1px solid #fde8e8', color: '#7b1414', fontSize: '0.8rem', padding: '0.6rem 0.875rem' }}>
                                🎯 Demo credentials pre-filled for <strong>{roles.find(r => r.id === selected)?.label}</strong>
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
                                {loading ? 'Signing in…' : <>{roles.find(r => r.id === selected)?.label} Login <ChevronRight size={18} /></>}
                            </button>
                        </form>

                        <p className="text-sm text-muted" style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                            Don't have an account? <Link to="/register" style={{ color: '#c9372a', fontWeight: 600 }}>Register here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
