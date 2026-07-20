import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, User, Shield, Briefcase, Truck, Users } from 'lucide-react';

export default function ManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('/api/users')
            .then(res => {
                setUsers(res.data);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to fetch platform users.');
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.phone && user.phone.includes(searchQuery));
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return <Shield size={16} className="text-red-500" />;
            case 'butcher':
                return <Briefcase size={16} className="text-sky-500" />;
            case 'delivery':
                return <Truck size={16} className="text-amber-500" />;
            default:
                return <User size={16} className="text-blue-500" />;
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin':
                return 'badge-red';
            case 'butcher':
                return 'badge-blue';
            case 'delivery':
                return 'badge-amber';
            default:
                return 'badge-gray';
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">👥 User Directory</h1>
                <p className="page-subtitle">View and audit all registered system accounts across all roles</p>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body flex gap-3 items-center" style={{ flexWrap: 'wrap', padding: '1rem 1.25rem' }}>

                    {/* Search Field */}
                    <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <Search size={18} className="text-muted" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or telephone number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="form-control"
                            style={{ paddingLeft: '38px', margin: 0 }}
                        />
                    </div>

                    {/* Role Filter */}
                    <div style={{ minWidth: '180px' }}>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="form-control"
                            style={{ margin: 0 }}
                        >
                            <option value="all">All Roles</option>
                            <option value="customer">Customers</option>
                            <option value="butcher">Butchers</option>
                            <option value="delivery">Delivery Partners</option>
                            <option value="admin">Administrators</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    <div className="table-wrap" style={{ margin: 0, border: 'none' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Name</th>
                                    <th>Email ID</th>
                                    <th>Phone</th>
                                    <th>Role Name</th>
                                    <th>Joined On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 0' }}>
                                            <div className="text-muted" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👥</div>
                                            <strong>No users match your query</strong>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td><span className="text-muted">#{user.id}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <User size={14} className="text-muted" />
                                                    </div>
                                                    <span className="font-semibold">{user.name}</span>
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>{user.phone || <span className="text-muted">—</span>}</td>
                                            <td>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} className={`badge ${getRoleBadgeClass(user.role)}`}>
                                                    {getRoleIcon(user.role)}
                                                    <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
                                                </div>
                                            </td>
                                            <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
