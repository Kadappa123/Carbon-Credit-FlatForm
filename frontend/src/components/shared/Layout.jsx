import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Leaf, BarChart2, ArrowLeftRight,
  Flame, User, LogOut, Menu, X, ShieldCheck,
  FileSearch, Building2, AlertTriangle, ChevronRight
} from 'lucide-react';

const companyNav = [
  { to: '/company', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/company/emissions/submit', icon: Leaf, label: 'Submit Emissions' },
  { to: '/company/marketplace', icon: BarChart2, label: 'Marketplace' },
  { to: '/company/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/company/retire', icon: Flame, label: 'Retire Credits' },
  { to: '/company/profile', icon: User, label: 'Profile' },
];

const govNav = [
  { to: '/gov', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/gov/submissions', icon: FileSearch, label: 'Review Submissions' },
  { to: '/gov/companies', icon: Building2, label: 'Manage Companies' },
  { to: '/gov/fraud', icon: AlertTriangle, label: 'Fraud Alerts' },
];

export default function Layout({ children }) {
  const { user, logout, isGovernment } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = isGovernment() ? govNav : companyNav;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const isActive = (path) =>
    path === '/company' || path === '/gov'
      ? location.pathname === path
      : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-gray-900 border-r border-gray-800 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-800 min-h-[64px]">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Leaf size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-bold text-sm text-white leading-tight">CarbonChain</p>
              <p className="text-xs text-gray-400">
                {isGovernment() ? 'Gov Portal' : 'Company Portal'}
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(to)
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-800">
          {sidebarOpen && (
            <div className="mb-2 px-3 py-2 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400">Logged in as</p>
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isGovernment() ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {user?.role}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Blockchain: <span className="text-emerald-400">Connected</span></span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}
