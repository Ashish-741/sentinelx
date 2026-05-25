/**
 * Navbar — Top navigation bar with search, notifications, theme toggle, and user dropdown.
 * All buttons are functional: theme toggle, notification panel, profile modal, settings modal.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  X,
  Trash2,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';

// Map route paths to breadcrumb labels
const breadcrumbMap = {
  '/dashboard': 'Dashboard',
  '/dashboard/scanner': 'URL Scanner',
  '/dashboard/email': 'Email Analyzer',
  '/dashboard/threat-intel': 'Threat Intelligence',
  '/dashboard/history': 'Scan History',
  '/dashboard/admin': 'Admin Panel',
};

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, dismiss, clearAll, addNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Seed some demo notifications on first mount
  useEffect(() => {
    if (unreadCount === 0) {
      addNotification({ type: 'warning', title: 'Suspicious URL Detected', message: 'paypa1-secure.tk flagged as phishing.', timeout: 0 });
      addNotification({ type: 'success', title: 'Scan Complete', message: 'google.com passed all security checks.', timeout: 0 });
      addNotification({ type: 'info', title: 'Welcome to SentinelX', message: 'Start scanning URLs or emails to detect threats.', timeout: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard/scanner?url=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const currentPage = breadcrumbMap[location.pathname] || 'Dashboard';

  const notifIcon = (type) => {
    if (type === 'warning') return '⚠️';
    if (type === 'error') return '🔴';
    if (type === 'success') return '✅';
    return 'ℹ️';
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-primary/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          {/* Left: Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500">/</span>
              <span className="text-slate-200 font-medium">{currentPage}</span>
            </div>
          </div>

          {/* Center: Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Quick scan a URL..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/50
                  text-sm text-slate-200 placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric/40
                  transition-all duration-200"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] text-slate-500 bg-slate-800 rounded border border-slate-700">
                ⌘K
              </kbd>
            </div>
          </form>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? 'dark' : 'light'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                className="relative p-2 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger text-[10px] font-bold text-white flex items-center justify-center"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </button>

              {/* Notification Panel */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 glass-card border border-slate-700/50 shadow-xl overflow-hidden"
                    style={{ zIndex: 100 }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50">
                      <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => { clearAll(); }}
                          className="text-xs text-slate-400 hover:text-danger flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Clear all
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors border-b border-slate-800/20 last:border-b-0"
                          >
                            <span className="text-base mt-0.5">{notifIcon(n.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-200 truncate">{n.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-slate-600 mt-1">
                                {n.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                            <button
                              onClick={() => dismiss(n.id)}
                              className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-electric to-purple flex items-center justify-center text-xs font-bold text-white">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block text-sm text-slate-300 max-w-[100px] truncate">
                  {user?.username || 'Agent'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 glass-card border border-slate-700/50 py-1.5 shadow-xl"
                    style={{ zIndex: 100 }}
                  >
                    <div className="px-3 py-2 border-b border-slate-800/50">
                      <p className="text-sm font-medium text-slate-200">{user?.username || 'Agent'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email || 'agent@sentinelx.io'}</p>
                    </div>
                    <button
                      onClick={() => { setDropdownOpen(false); setProfileOpen(true); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); setSettingsOpen(true); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <div className="border-t border-slate-800/50 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* =============== Profile Modal =============== */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setProfileOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 glass-card border border-slate-700/50 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-100">User Profile</h2>
                <button onClick={() => setProfileOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-electric to-purple flex items-center justify-center text-3xl font-bold text-white mb-3">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 className="text-lg font-medium text-slate-100">{user?.username || 'Agent'}</h3>
                <p className="text-sm text-slate-400">{user?.email || 'agent@sentinelx.io'}</p>
                <span className="mt-2 px-3 py-0.5 rounded-full text-xs font-medium bg-electric/15 text-electric border border-electric/30">
                  {user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                </span>
              </div>

              {/* Info Grid */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-800/30">
                  <span className="text-sm text-slate-400">Username</span>
                  <span className="text-sm text-slate-200 font-medium">{user?.username || '—'}</span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-800/30">
                  <span className="text-sm text-slate-400">Email</span>
                  <span className="text-sm text-slate-200 font-medium">{user?.email || '—'}</span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-800/30">
                  <span className="text-sm text-slate-400">Role</span>
                  <span className="text-sm text-slate-200 font-medium capitalize">{user?.role || 'user'}</span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-800/30">
                  <span className="text-sm text-slate-400">Total Scans</span>
                  <span className="text-sm text-electric font-medium">{user?.totalScans ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-800/30">
                  <span className="text-sm text-slate-400">Member Since</span>
                  <span className="text-sm text-slate-200 font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =============== Settings Modal =============== */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 glass-card border border-slate-700/50 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-100">Settings</h2>
                <button onClick={() => setSettingsOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Appearance */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Appearance</h3>
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <div className="flex items-center gap-3">
                    {isDark ? <Moon className="w-5 h-5 text-electric" /> : <Sun className="w-5 h-5 text-warning" />}
                    <div>
                      <p className="text-sm text-slate-200">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                      <p className="text-xs text-slate-500">Toggle the UI theme</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${isDark ? 'bg-electric/30' : 'bg-slate-600'}`}
                  >
                    <motion.div
                      animate={{ x: isDark ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute top-1 w-4 h-4 rounded-full ${isDark ? 'bg-electric' : 'bg-slate-300'}`}
                    />
                  </button>
                </div>
              </div>

              {/* Notifications Settings */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Notifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <div>
                      <p className="text-sm text-slate-200">Email Alerts</p>
                      <p className="text-xs text-slate-500">Receive email when threats are detected</p>
                    </div>
                    <div className="w-4 h-4 rounded border border-electric/50 bg-electric/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-electric" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <div>
                      <p className="text-sm text-slate-200">In-App Notifications</p>
                      <p className="text-xs text-slate-500">Show real-time alerts in the dashboard</p>
                    </div>
                    <div className="w-4 h-4 rounded border border-electric/50 bg-electric/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-electric" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Info */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">Session</h3>
                <div className="py-3 px-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-500">Logged in as</span>
                    <span className="text-xs text-slate-300">{user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">API endpoint</span>
                    <span className="text-xs text-slate-300 font-mono">/api</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
