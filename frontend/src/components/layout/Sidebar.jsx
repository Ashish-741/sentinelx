/**
 * Sidebar — Collapsible navigation sidebar with SentinelX branding.
 */
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Globe,
  Mail,
  Shield,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/dashboard/scanner', label: 'URL Scanner', icon: Globe },
  { path: '/dashboard/email', label: 'Email Analyzer', icon: Mail },
  { path: '/dashboard/threat-intel', label: 'Threat Intel', icon: Shield },
  { path: '/dashboard/history', label: 'Scan History', icon: History },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const adminItems = [
  { path: '/dashboard/admin', label: 'Admin Panel', icon: Users },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  const sidebarWidth = collapsed ? 'w-16' : 'w-60';

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 mb-2">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-electric/20 flex items-center justify-center neon-glow-blue">
          <ShieldCheck className="w-5 h-5 text-electric" />
        </div>
        <AnimatePresence>
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-lg font-bold text-gradient">SentinelX</h1>
              <p className="text-[10px] text-slate-500 -mt-0.5">Threat Detection</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-2 space-y-1">
        <p className={`text-[10px] uppercase tracking-wider text-slate-600 px-3 mb-2 ${collapsed && !isMobile ? 'hidden' : ''}`}>
          Main Menu
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => isMobile && setMobileOpen(false)}
            end={item.end}
            className={({ isActive }) => {
              return `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 group relative
                ${isActive
                  ? 'bg-electric/10 text-electric'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
              `;
            }}
          >
            {/* Active indicator bar */}
            {location.pathname === item.path && (
              <motion.div
                layoutId="activeTab"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-electric rounded-r"
                style={{ boxShadow: '0 0 8px rgba(0,212,255,0.6)' }}
              />
            )}
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {(!collapsed || isMobile) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className={`pt-4 ${collapsed && !isMobile ? 'hidden' : ''}`}>
              <p className="text-[10px] uppercase tracking-wider text-slate-600 px-3 mb-2">
                Admin
              </p>
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                className={() => {
                  const isActive = location.pathname === item.path;
                  return `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'bg-purple/10 text-purple'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                  `;
                }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {(!collapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User profile at bottom */}
      <div className="p-3 border-t border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric to-purple flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-slate-200 truncate">{user?.username || 'Agent'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || 'agent@sentinelx.io'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-electric hover:border-electric/50 transition-colors z-10 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`hidden lg:block fixed left-0 top-0 h-screen z-30
          bg-surface/80 backdrop-blur-xl border-r border-slate-800/50 overflow-hidden`}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl glass-card text-slate-300 cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-64 z-50
                bg-surface border-r border-slate-800/50"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
