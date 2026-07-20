import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star } from 'lucide-react';

export default function ReviewPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get(`/api/orders/${orderId}`).then(r => setOrder(r.data)).catch(() => { });
    }, [orderId]);

    const submit = async () => {
        if (!rating) { setError('Please select a rating'); return; }
        setLoading(true);
        try {
            await axios.post('/api/reviews', { shop_id: order.shop_id, order_id: parseInt(orderId), rating, comment });
            setDone(true);
            setTimeout(() => navigate('/customer/shops'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    if (done) return (
        <div className="empty-state" style={{ paddingTop: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⭐</div>
            <h2>Thanks for your review!</h2>
            <p className="text-muted">Redirecting you back to shops...</p>
        </div>
    );

    return (
        <div style={{ maxWidth: 500, margin: '2rem auto' }}>
            <div className="card">
                <div className="card-body" style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '0.25rem' }}>Rate Your Experience</h2>
                    {order && <p className="text-muted text-sm" style={{ marginBottom: '2rem' }}>Order from <strong>{order.shop_name}</strong></p>}

                    <div className="star-rating" style={{ justifyContent: 'center', marginBottom: '1.5rem', gap: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map(n => (
                            <span
                                key={n}
                                className="star"
                                style={{ fontSize: '2.5rem', color: (hover || rating) >= n ? '#f59e0b' : '#e4e4e7' }}
                                onMouseEnter={() => setHover(n)}
                                onMouseLeave={() => setHover(0)}
                                onClick={() => setRating(n)}
                            >★</span>
                        ))}
                    </div>
                    <div className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][rating]}
                    </div>

                    {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                    <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                        <label className="form-label">Your Review (optional)</label>
                        <textarea className="form-control" rows={4} value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience about the meat quality, freshness, and service..." />
                    </div>

                    <button className="btn btn-primary btn-lg btn-full" onClick={submit} disabled={loading}>
                        {loading ? 'Submitting…' : '⭐ Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    );
}
