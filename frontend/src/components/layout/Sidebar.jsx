import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Store, ShoppingCart, ClipboardList, LayoutDashboard,
  Boxes, BarChart2, BadgeCheck, DollarSign, LogOut
} from 'lucide-react';

const navConfig = {
  customer: [
    { to: '/customer/home', icon: Store, label: 'Browse Shops' },
    { to: '/customer/cart', icon: ShoppingCart, label: 'My Cart' },
    { to: '/customer/orders', icon: ClipboardList, label: 'My Orders' },
  ],
  butcher: [
    { to: '/butcher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/butcher/inventory', icon: Boxes, label: 'Stock & Pricing' },
    { to: '/butcher/orders', icon: ClipboardList, label: 'Customer Orders' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/shops', icon: BadgeCheck, label: 'Verify Shops' },
    { to: '/admin/market-prices', icon: DollarSign, label: 'Market Prices' },
    { to: '/admin/reports', icon: BarChart2, label: 'Reports & Stats' },
  ],
};

const roleBadge = { customer: 'Customer', butcher: 'Shop Owner', admin: 'Admin' };
const roleColor = { customer: '#c9372a', butcher: '#b45309', admin: '#1d4ed8' };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;
  const links = navConfig[user.role] || [];
  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => { 
    logout(); 
    navigate('/login'); 
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🥩</span>
        <div>
          <div className="sidebar-logo-text">FreshCut</div>
          <div className="sidebar-logo-sub">Connect</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Navigation</div>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar" style={{ background: roleColor[user.role] }}>{initials}</div>
          <div>
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{roleBadge[user.role]}</div>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="btn btn-ghost btn-sm btn-full" 
          style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.15)' }}
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  );
}
