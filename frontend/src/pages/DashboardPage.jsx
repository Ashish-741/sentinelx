/**
 * @fileoverview Dashboard Page - Main SOC dashboard with charts, threat score ring,
 * animated counters, and recent activity feed.
 */

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Shield, Globe, Mail, AlertTriangle, Activity, TrendingUp } from 'lucide-react';
import Card from '../components/common/Card';
import AnimatedCounter from '../components/common/AnimatedCounter';
import ProgressRing from '../components/common/ProgressRing';
import Badge from '../components/common/Badge';
import ThreatFeed from '../components/dashboard/ThreatFeed';
import WorldMap from '../components/dashboard/WorldMap';
import { getDashboardStats, getRecentScans, getThreatTrends } from '../services/api';
import { unwrap } from '../services/api';
import './DashboardPage.css';

// Color palette for charts
const CHART_COLORS = {
  electric: '#00d4ff',
  neon: '#00ff88',
  warning: '#ffaa00',
  danger: '#ff3366',
  purple: '#7c3aed',
};

const PIE_COLORS = ['#00d4ff', '#00ff88', '#ffaa00', '#ff3366'];

// Custom tooltip for the area chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        <p className="chart-tooltip-value">
          {payload[0].value} scans
        </p>
      </div>
    );
  }
  return null;
};

// Risk level color mapping
const riskColorMap = {
  safe: { color: CHART_COLORS.neon, variant: 'safe' },
  low: { color: CHART_COLORS.neon, variant: 'safe' },
  medium: { color: CHART_COLORS.warning, variant: 'suspicious' },
  suspicious: { color: CHART_COLORS.warning, variant: 'suspicious' },
  high: { color: CHART_COLORS.danger, variant: 'dangerous' },
  critical: { color: CHART_COLORS.danger, variant: 'dangerous' },
  dangerous: { color: CHART_COLORS.danger, variant: 'dangerous' },
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalScans: 0,
    threatsDetected: 0,
    urlsAnalyzed: 0,
    emailsChecked: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, recentRes, trendRes] = await Promise.all([
          getDashboardStats(),
          getRecentScans(),
          getThreatTrends().catch(() => null),
        ]);
        const statsData = unwrap(statsRes);
        const recentData = unwrap(recentRes);
        const scans = recentData.scans || [];

        // Count scan types from recent scans
        const urlCount = scans.filter((s) => s.type === 'url').length;
        const emailCount = scans.filter((s) => s.type === 'email').length;

        setStats({
          totalScans: statsData.totalScans ?? 0,
          threatsDetected: statsData.threatsDetected ?? 0,
          urlsAnalyzed: urlCount,
          emailsChecked: emailCount,
        });

        // Process trend data for area chart
        if (trendRes) {
          const trends = unwrap(trendRes);
          const trendArray = trends.trend || trends.trends || trends.dailyActivity || (Array.isArray(trends) ? trends : []);
          if (Array.isArray(trendArray)) {
            setTrendData(
              trendArray.map((t) => ({
                date: t._id || t.date,
                scans: t.total || t.count || t.scans || 0,
              }))
            );
          }
        }

        // Build risk distribution for pie chart
        const riskCounts = {};
        scans.forEach((s) => {
          const risk = s.result?.riskLevel || 'safe';
          riskCounts[risk] = (riskCounts[risk] || 0) + 1;
        });
        setRiskDistribution(
          Object.entries(riskCounts).map(([name, value], i) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: PIE_COLORS[i % PIE_COLORS.length],
          }))
        );

        // Build recent activity list
        setRecentActivity(
          scans.slice(0, 8).map((s) => ({
            id: s._id,
            type: s.type,
            target: s.target || '',
            risk: s.result?.riskLevel || 'safe',
            score: s.result?.riskScore ?? 0,
            time: s.createdAt,
          }))
        );
      } catch {
        toast.error('Could not load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const threatScore =
    stats.totalScans > 0
      ? Math.round((stats.threatsDetected / stats.totalScans) * 100)
      : 0;

  const threatColor =
    threatScore >= 60 ? CHART_COLORS.danger
      : threatScore >= 30 ? CHART_COLORS.warning
        : CHART_COLORS.neon;

  // Stat card data
  const statCards = [
    { icon: Shield, label: 'Total Scans', value: stats.totalScans, color: CHART_COLORS.electric },
    { icon: AlertTriangle, label: 'Threats Found', value: stats.threatsDetected, color: CHART_COLORS.danger },
    { icon: Globe, label: 'URLs Analyzed', value: stats.urlsAnalyzed, color: CHART_COLORS.neon },
    { icon: Mail, label: 'Emails Checked', value: stats.emailsChecked, color: CHART_COLORS.purple },
  ];

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Security Dashboard</h1>
          <p>Real-time threat monitoring and analytics</p>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-5 shimmer" style={{ height: 120 }} />
          ))}
        </div>
        <div className="dashboard-grid">
          <div className="glass-card p-5 shimmer" style={{ height: 300 }} />
          <div className="glass-card p-5 shimmer" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* ── Header ── */}
      <div className="dashboard-header">
        <h1>Security Dashboard</h1>
        <p>Real-time threat monitoring and analytics</p>
      </div>

      {/* ── Stat Cards with AnimatedCounters ── */}
      <div className="stats-grid">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card className="stat-card">
              <div className="stat-card-inner">
                <div className="stat-icon-wrap" style={{ backgroundColor: `${stat.color}15` }}>
                  <stat.icon size={22} style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="stat-number" style={{ color: stat.color }}>
                    <AnimatedCounter value={stat.value} duration={1500} />
                  </div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Main Grid: Charts + Threat Score ── */}
      <div className="dashboard-grid-2col">
        {/* Scan Activity Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card
            title="Scan Activity"
            subtitle="Last 7 days"
            icon={TrendingUp}
            className="chart-card"
          >
            {trendData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.electric} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.electric} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(100,116,139,0.2)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="scans"
                      stroke={CHART_COLORS.electric}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorScans)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="chart-empty">
                <Activity size={32} className="text-slate-600" />
                <p>No scan activity data yet. Start scanning to see trends.</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Threat Score Ring + Risk Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card
            title="Threat Overview"
            subtitle="Risk distribution"
            icon={Shield}
            className="chart-card"
          >
            <div className="threat-overview-grid">
              {/* Threat Score Ring */}
              <div className="threat-ring-wrap">
                <ProgressRing
                  value={threatScore}
                  max={100}
                  size={140}
                  strokeWidth={10}
                  color={threatColor}
                  label="Threat Score"
                />
              </div>

              {/* Risk Distribution Pie */}
              {riskDistribution.length > 0 ? (
                <div className="pie-wrap">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="pie-empty">
                  <p className="text-sm text-slate-500">No risk data yet</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Live Threat Intelligence (WebSockets) ── */}
      <div className="dashboard-grid-2col" style={{ marginTop: '24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          <Card
            title="Live Global Threats"
            subtitle="Real-time geo-tracking"
            icon={Globe}
            className="chart-card"
          >
            <WorldMap />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card
            title="Real-time Threat Feed"
            subtitle="WebSockets Live Stream"
            icon={Activity}
            className="activity-card"
            style={{ height: '100%' }}
          >
            <ThreatFeed initialData={recentActivity} />
          </Card>
        </motion.div>
      </div>

      {/* ── Recent Activity Feed ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card
          title="Recent Activity"
          subtitle="Latest scan results"
          icon={Activity}
          className="activity-card"
        >
          {recentActivity.length === 0 ? (
            <div className="chart-empty">
              <Shield size={32} className="text-slate-600" />
              <p>No scans yet. Run a URL or email scan to get started.</p>
            </div>
          ) : (
            <div className="activity-table">
              <div className="activity-table-header">
                <span>Type</span>
                <span>Target</span>
                <span>Risk</span>
                <span>Score</span>
                <span>Time</span>
              </div>
              {recentActivity.map((item, i) => {
                const riskInfo = riskColorMap[item.risk] || riskColorMap.safe;
                return (
                  <motion.div
                    key={item.id}
                    className="activity-table-row"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.3 }}
                  >
                    <span className="activity-type">
                      {item.type === 'url' ? (
                        <Globe size={14} className="text-electric" />
                      ) : (
                        <Mail size={14} className="text-purple" />
                      )}
                      {item.type.toUpperCase()}
                    </span>
                    <span className="activity-target" title={item.target}>
                      {item.target.length > 40
                        ? item.target.slice(0, 40) + '…'
                        : item.target}
                    </span>
                    <span>
                      <Badge variant={riskInfo.variant} dot pulse={item.risk !== 'safe'}>
                        {item.risk}
                      </Badge>
                    </span>
                    <span className="activity-score" style={{ color: riskInfo.color }}>
                      {item.score}%
                    </span>
                    <span className="activity-time">
                      {item.time ? new Date(item.time).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      }) : '—'}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
