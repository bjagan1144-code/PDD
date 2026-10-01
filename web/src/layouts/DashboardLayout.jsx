import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Cpu, 
  Activity, 
  Brain, 
  Pill, 
  Layers, 
  History as HistoryIcon, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  User, 
  Search, 
  CircleDot, 
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getStorageItem, setStorageItem, KEYS } from '../utils/storage';
import Button from '../components/Button';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // Load notifications periodically or on mount
    const notifs = getStorageItem(KEYS.NOTIFICATIONS, []);
    setNotifications(notifs);
  }, [location.pathname]);

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setStorageItem(KEYS.NOTIFICATIONS, updated);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Simulator', path: '/simulator', icon: Cpu },
    { name: 'Release Monitor', path: '/release-monitor', icon: Activity },
    { name: 'AI Prediction', path: '/ai-prediction', icon: Brain },
    { name: 'Drug Library', path: '/drugs', icon: Pill },
    { name: 'Polymer Library', path: '/polymers', icon: Layers },
    { name: 'Simulation History', path: '/history', icon: HistoryIcon },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getPageTitle = () => {
    const matched = menuItems.find(item => item.path === location.pathname);
    return matched ? matched.name : 'BioPatch AI Workspace';
  };

  return (
    <div className="min-h-screen flex bg-[#090c15] text-slate-100">
      {/* BACKGROUND GRAPHIC */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.03),transparent_50%)] pointer-events-none" />

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/80 bg-[#0d111d] flex-shrink-0 z-20">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-[#0a0e18]">
          <Link to="/dashboard" className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-medical-600 to-biotech-400 flex items-center justify-center shadow-lg shadow-medical-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-medical-300">
                BIOPATCH <span className="text-medical-400 font-extrabold text-xs">AI</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-medical-500/10 to-biotech-500/5 text-medical-400 border border-medical-500/20 shadow-md shadow-medical-500/5' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 mr-3 ${isActive ? 'text-medical-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0a0e18] space-y-4">
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="text-slate-500 font-semibold">System:</span>
            <span className="flex items-center text-emerald-400 font-bold">
              <CircleDot className="h-3 w-3 mr-1 fill-emerald-400/20 animate-pulse" />
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-2.5">
              <img 
                src={user?.avatarUrl} 
                alt={user?.name}
                className="h-8.5 w-8.5 rounded-full border border-slate-700 object-cover" 
              />
              <div className="truncate w-24">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          
          <aside className="relative flex flex-col w-64 max-w-xs bg-[#0d111d] border-r border-slate-800 h-full z-10 transition-transform">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-[#0a0e18]">
              <Link to="/dashboard" className="flex items-center space-x-2" onClick={() => setIsMobileOpen(false)}>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-medical-600 to-biotech-400 flex items-center justify-center">
                  <Activity className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="font-bold text-sm tracking-wider">BIOPATCH AI</span>
              </Link>
              <button onClick={() => setIsMobileOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium ${
                      isActive 
                        ? 'bg-medical-500/10 text-medical-400 border border-medical-500/20' 
                        : 'text-slate-400 hover:bg-slate-800/30'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800 bg-[#0a0e18]">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-sm font-medium transition-colors"
              >
                <LogOut className="h-4.5 w-4.5 mr-2" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* HEADER BAR */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-[#0d111d]/90 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            <h2 className="text-sm lg:text-base font-bold text-slate-200 tracking-wider uppercase">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar (Visual Only for dashboard context) */}
            <div className="hidden md:flex items-center bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 focus-within:border-medical-500 transition-colors">
              <Search className="h-4 w-4 text-slate-500 mr-2" />
              <input 
                type="text" 
                placeholder="Search simulations..." 
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-none w-48 placeholder-slate-500"
              />
            </div>

            {/* NOTIFICATIONS DROPDOWN */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                }}
                className={`relative p-2 rounded-lg border border-slate-800/80 hover:bg-slate-800/30 text-slate-400 hover:text-slate-200 transition-colors ${
                  isNotifOpen ? 'bg-slate-800/30 text-slate-200' : ''
                }`}
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-medical-500 ring-2 ring-[#0d111d] animate-pulse" />
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-slate-800 bg-[#101423] shadow-2xl overflow-hidden z-50">
                  <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800 bg-[#0c101c]">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Alert Center</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-medical-400 hover:text-medical-300 font-bold flex items-center"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        No notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3.5 text-xs transition-colors hover:bg-slate-900/40 ${
                            !n.read ? 'bg-slate-900/10 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className={`font-bold uppercase tracking-wider text-[9px] mb-1 ${
                              n.type === 'warning' ? 'text-amber-400' : n.type === 'success' ? 'text-emerald-400' : 'text-cyan-400'
                            }`}>
                              {n.title}
                            </span>
                            <span className="text-[9px] text-slate-500">{n.time}</span>
                          </div>
                          <p className="text-slate-300 leading-normal">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE ACCORDION */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-800"
              >
                <img 
                  src={user?.avatarUrl} 
                  alt={user?.name}
                  className="h-8 w-8 rounded-full border border-slate-700 object-cover" 
                />
                <span className="hidden md:block text-xs font-semibold text-slate-300">{user?.name.split(' ')[0]}</span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2.5 w-48 rounded-xl border border-slate-800 bg-[#101423] shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-800 bg-[#0c101c]">
                    <p className="text-xs font-bold text-slate-200">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link 
                      to="/settings" 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-3 py-2 text-xs text-slate-300 hover:text-slate-100 rounded-lg hover:bg-slate-800/40"
                    >
                      <User className="h-4 w-4 mr-2 text-slate-400" />
                      View Profile
                    </Link>
                    <Link 
                      to="/settings" 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-3 py-2 text-xs text-slate-300 hover:text-slate-100 rounded-lg hover:bg-slate-800/40"
                    >
                      <Settings className="h-4 w-4 mr-2 text-slate-400" />
                      Account Settings
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors border border-transparent hover:border-rose-500/10"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto px-6 py-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
