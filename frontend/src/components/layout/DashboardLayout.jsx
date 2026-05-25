/**
 * DashboardLayout — Wraps Sidebar + Navbar + main content area with animated page transitions.
 * The sidebar is fixed, the main content scrolls independently.
 */
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-primary bg-grid-pattern">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main area — offset by sidebar width on desktop */}
      <div className="lg:ml-60 flex flex-col min-h-screen">
        {/* Sticky Navbar */}
        <Navbar />

        {/* Page content — scrollable, no extra top padding since navbar is in-flow */}
        <main className="flex-1 px-4 pb-6 pt-2 lg:px-6 lg:pb-8 lg:pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
