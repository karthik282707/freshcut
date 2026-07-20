import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle2, Inbox, Calendar, MessageSquare } from 'lucide-react';

export default function ComplaintsPage() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState({});
    const [updating, setUpdating] = useState({});
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const res = await axios.get('/api/reviews/complaints');
            setComplaints(res.data);
            const nt = {};
            res.data.forEach(c => {
                nt[c.id] = c.admin_notes || '';
            });
            setNotes(nt);
        } catch (err) {
            setError('Failed to fetch platform complaints.');
        } finally {
            setLoading(false);
        }
    };

    const handleNotesChange = (id, val) => {
        setNotes({ ...notes, [id]: val });
    };

    const resolveComplaint = async (id, status) => {
        setUpdating(u => ({ ...u, [id]: true }));
        setError('');
        setMsg('');
        try {
            const res = await axios.patch(`/api/reviews/complaints/${id}`, {
                status,
                admin_notes: notes[id]
            });
            setComplaints(complaints.map(c => c.id === id ? {
                ...c,
                status: res.data.status,
                admin_notes: res.data.admin_notes,
                resolved_at: res.data.resolved_at
            } : c));
            setMsg(`Complaint #${id} updated successfully to ${status}.`);
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setError('Failed to update complaint.');
        } finally {
            setUpdating(u => ({ ...u, [id]: false }));
        }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    const filteredComplaints = complaints.filter(c => statusFilter === 'all' || c.status === statusFilter);

    const getStatusClass = (status) => {
        switch (status) {
            case 'resolved':
                return 'badge-green';
            case 'in_review':
                return 'badge-amber';
            default:
                return 'badge-red';
        }
    };

    return (
        <div>
            <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">⚠️ Customer Grievance Center</h1>
                    <p className="page-subtitle">Inspect filed issues, investigate orders, and coordinate resolution pathways</p>
                </div>
                <div className="flex gap-2">
                    {['all', 'open', 'in_review', 'resolved'].map(statusOpt => (
                        <button
                            key={statusOpt}
                            onClick={() => setStatusFilter(statusOpt)}
                            className={`btn btn-sm ${statusFilter === statusOpt ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {statusOpt}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}
            {msg && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{msg}</div>}

            {filteredComplaints.length === 0 ? (
                <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                    <div className="empty-state-icon text-muted">Inbox</div>
                    <h2>No grievances found</h2>
                    <p>There are no filed complaints matching the status: <strong>{statusFilter}</strong></p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {filteredComplaints.map(comp => (
                        <div key={comp.id} className="card" style={{ marginBottom: 0 }}>
                            <div className="card-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={18} className="text-red-500" />
                                    <h3 style={{ margin: 0, fontWeight: 700 }}>Complaint #{comp.id}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${getStatusClass(comp.status)}`}>
                                        {comp.status.toUpperCase().replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="grid grid-3" style={{ gap: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                    <div>
                                        <label className="text-xs text-muted font-bold block" style={{ textTransform: 'uppercase' }}>Reporter (Customer)</label>
                                        <div className="font-semibold text-sm" style={{ marginTop: '0.15rem' }}>{comp.reporter_name}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted font-bold block" style={{ textTransform: 'uppercase' }}>Associated Shop</label>
                                        <div className="font-semibold text-sm" style={{ marginTop: '0.15rem' }}>{comp.shop_name || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted font-bold block" style={{ textTransform: 'uppercase' }}>Order Reference</label>
                                        <div className="font-semibold text-sm" style={{ marginTop: '0.15rem' }}>
                                            {comp.order_id ? (
                                                <span className="text-primary font-mono">#{comp.order_id}</span>
                                            ) : 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label className="text-xs text-muted font-bold block" style={{ textTransform: 'uppercase', marginBottom: '0.25rem' }}>Problem Description</label>
                                    <p className="text-sm bg-gray-50 p-3 rounded" style={{ margin: 0, background: 'var(--border)', padding: '0.75rem', borderRadius: '6px' }}>
                                        {comp.description}
                                    </p>
                                    <div className="text-xs text-muted mt-1">Submitted: {new Date(comp.created_at).toLocaleString()}</div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label" style={{ fontWeight: 600 }}>Administrative Action Notes</label>
                                    <textarea
                                        className="form-control"
                                        placeholder="Record details of actions taken, refunds processing, or partner warnings..."
                                        rows={2}
                                        value={notes[comp.id] ?? ''}
                                        onChange={(e) => handleNotesChange(comp.id, e.target.value)}
                                        disabled={comp.status === 'resolved'}
                                    />
                                </div>

                                {comp.resolved_at && (
                                    <div className="text-xs text-muted" style={{ marginBottom: '1rem' }}>
                                        Resolved: {new Date(comp.resolved_at).toLocaleString()}
                                    </div>
                                )}

                                {comp.status !== 'resolved' && (
                                    <div className="flex justify-end gap-2">
                                        {comp.status === 'open' && (
                                            <button
                                                onClick={() => resolveComplaint(comp.id, 'in_review')}
                                                disabled={updating[comp.id]}
                                                className="btn btn-ghost btn-sm"
                                            >
                                                Mark In-Review
                                            </button>
                                        )}
                                        <button
                                            onClick={() => resolveComplaint(comp.id, 'resolved')}
                                            disabled={updating[comp.id]}
                                            className="btn btn-green btn-sm flex items-center gap-1"
                                            style={{ backgroundColor: '#10b981', color: 'white' }}
                                        >
                                            <CheckCircle2 size={14} /> Resolve Grievance
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
