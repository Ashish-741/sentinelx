import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function WorldMap() {
  const [dots, setDots] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });

    socket.on('new_threat', (threat) => {
      // Create a random dot on the map when a threat comes in
      const newDot = {
        id: threat.id + Date.now(),
        // Random coords roughly mapped to landmasses (very naive for visual effect)
        x: Math.random() * 80 + 10, 
        y: Math.random() * 60 + 20,
        color: threat.riskLevel === 'dangerous' ? '#ff3366' : '#ffaa00'
      };
      setDots((prev) => [...prev, newDot]);
      
      // Remove dot after 4 seconds
      setTimeout(() => {
        setDots((prev) => prev.filter(d => d.id !== newDot.id));
      }, 4000);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '220px', background: 'rgba(15,23,42,0.3)', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Super simple abstract dotted map background using CSS pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.2) 1px, transparent 1px)',
        backgroundSize: '10px 10px',
        opacity: 0.5
      }} />
      
      <AnimatePresence>
        {dots.map(dot => (
          <motion.div
            key={dot.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 2, 1], opacity: [1, 0.8, 0] }}
            transition={{ duration: 3, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: '12px',
              height: '12px',
              backgroundColor: dot.color,
              borderRadius: '50%',
              boxShadow: `0 0 15px ${dot.color}`
            }}
          />
        ))}
      </AnimatePresence>
      <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: '10px', color: '#64748b' }}>
        Live Global Threat Activity
      </div>
    </div>
  );
}
