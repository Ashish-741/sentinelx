/**
 * @fileoverview Admin Page - Platform administration
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  getAllUsers,
  banUser,
  getAdminAnalytics,
  getSystemLogs,
  getAPIUsage,
} from '../services/api';
import { unwrap } from '../services/api';
import './AdminPage.css';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [apiUsage, setApiUsage] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      const data = unwrap(res);
      setUsers(
        (data.users || []).map((u) => ({
          id: u._id,
          username: u.username,
          email: u.email,
          role: u.role,
          status: u.isActive ? 'active' : 'banned',
        }))
      );
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await getAdminAnalytics();
      setAnalytics(unwrap(res));
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await getSystemLogs({ limit: 20 });
      const data = unwrap(res);
      setLogs(data.logs || []);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const loadApiUsage = async () => {
    setLoading(true);
    try {
      const res = await getAPIUsage();
      const data = unwrap(res);
      setApiUsage(data.usage);
    } catch {
      toast.error('Failed to load API usage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      if (activeTab === 'users') loadUsers();
      if (activeTab === 'analytics') loadAnalytics();
      if (activeTab === 'logs') loadLogs();
      if (activeTab === 'api') loadApiUsage();
    }, 0);
  }, [activeTab]);

  const handleBan = async (userId) => {
    try {
      await banUser(userId);
      toast.success('User status updated');
      loadUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>Manage users, analytics, and system settings</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Audit Logs
        </button>
        <button
          className={`tab ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          API Usage
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {activeTab === 'users' && !loading && (
        <div className="admin-content">
          <h3>User Management</h3>
          <Card className="users-table">
            {users.map((user) => (
              <div key={user.id} className="user-row">
                <div className="user-info">
                  <p className="username">{user.username}</p>
                  <p className="email">{user.email}</p>
                </div>
                <Badge variant={user.role === 'admin' ? 'info' : 'secondary'}>
                  {user.role}
                </Badge>
                <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                  {user.status}
                </Badge>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleBan(user.id)}
                >
                  {user.status === 'active' ? 'Ban' : 'Unban'}
                </Button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {activeTab === 'analytics' && analytics && !loading && (
        <div className="admin-content">
          <h3>Platform Analytics</h3>
          <Card>
            <p>Total Users: {analytics.totalUsers}</p>
            <p>Active Users: {analytics.activeUsers}</p>
            <p>Total Scans: {analytics.totalScans}</p>
          </Card>
        </div>
      )}

      {activeTab === 'logs' && !loading && (
        <div className="admin-content">
          <h3>Audit Logs</h3>
          <Card>
            {logs.length === 0 ? (
              <p>No audit logs yet.</p>
            ) : (
              logs.map((log) => (
                <p key={log._id}>
                  {log.action}: {log.target || log.userId?.email || '—'} —{' '}
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              ))
            )}
          </Card>
        </div>
      )}

      {activeTab === 'api' && apiUsage && !loading && (
        <div className="admin-content">
          <h3>API Integrations & Usage</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <Card>
              <h4 style={{ color: '#00d4ff', marginBottom: '10px' }}>VirusTotal</h4>
              <p>Used: {apiUsage.virusTotal.used} / {apiUsage.virusTotal.dailyLimit}</p>
              <p>Remaining: {apiUsage.virusTotal.remaining}</p>
              <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', marginTop: '10px' }}>
                <div style={{ width: `${(apiUsage.virusTotal.used / apiUsage.virusTotal.dailyLimit) * 100}%`, height: '100%', background: '#00d4ff', borderRadius: '4px' }} />
              </div>
            </Card>
            <Card>
              <h4 style={{ color: '#00ff88', marginBottom: '10px' }}>AbuseIPDB</h4>
              <p>Used: {apiUsage.abuseIPDB.used} / {apiUsage.abuseIPDB.dailyLimit}</p>
              <p>Remaining: {apiUsage.abuseIPDB.remaining}</p>
              <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', marginTop: '10px' }}>
                <div style={{ width: `${(apiUsage.abuseIPDB.used / apiUsage.abuseIPDB.dailyLimit) * 100}%`, height: '100%', background: '#00ff88', borderRadius: '4px' }} />
              </div>
            </Card>
            <Card style={{ gridColumn: '1 / -1' }}>
              <h4 style={{ color: '#7c3aed', marginBottom: '10px' }}>SentinelX ML Service</h4>
              <p>Status: <Badge variant="success">Online</Badge></p>
              <p>Total Internal Requests: {apiUsage.mlService.totalRequests}</p>
              <p>Avg Response Time: {apiUsage.mlService.avgResponseTime}</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
