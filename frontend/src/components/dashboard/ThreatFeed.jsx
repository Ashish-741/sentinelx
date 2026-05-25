import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Mail } from 'lucide-react';
import Badge from '../common/Badge';
import './ThreatFeed.css';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ThreatFeed({ initialData = [] }) {
  const [threats, setThreats] = useState([]);

  useEffect(() => {
    if (initialData.length > 0 && threats.length === 0) {
      const formatted = initialData.map(item => ({
        id: item.id,
        type: item.type,
        target: item.target,
        riskLevel: item.risk,
        riskScore: item.score,
        timestamp: item.time
      }));
      setThreats(formatted);
    }
  }, [initialData]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.on('new_threat', (threat) => {
      setThreats((prev) => [threat, ...prev].slice(0, 50)); // keep last 50
    });

    return () => socket.disconnect();
  }, []);

  if (threats.length === 0) {
    return (
      <div className="threat-feed-empty text-slate-400 text-sm p-4 text-center">
        <div className="pulse-dot-wrap mb-2 mx-auto">
          <div className="pulse-dot"></div>
        </div>
        Listening for real-time threats...
      </div>
    );
  }

  return (
    <div className="threat-feed-container">
      <AnimatePresence>
        {threats.map((threat) => (
          <motion.div
            key={threat.id + threat.timestamp}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`threat-feed-item risk-${threat.riskLevel}`}
          >
            <div className="threat-icon">
              {threat.type === 'url' ? <Globe size={16} /> : <Mail size={16} />}
            </div>
            <div className="threat-details">
              <span className="threat-target" title={threat.target}>
                {threat.target.length > 35 ? threat.target.slice(0, 35) + '...' : threat.target}
              </span>
              <span className="threat-time">
                {new Date(threat.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="threat-badge">
              <Badge variant={threat.riskLevel === 'dangerous' || threat.riskLevel === 'critical' ? 'dangerous' : threat.riskLevel === 'suspicious' ? 'suspicious' : 'safe'} dot>
                {threat.riskScore}%
              </Badge>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
