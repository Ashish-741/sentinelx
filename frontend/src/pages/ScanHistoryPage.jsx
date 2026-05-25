/**
 * @fileoverview Scan History Page - View past scans
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { getScanHistory } from '../services/api';
import { unwrap } from '../services/api';
import './ScanHistoryPage.css';

export default function ScanHistoryPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getScanHistory({ limit: 50 });
        const data = unwrap(res);
        setScans(
          (data.scans || []).map((scan) => ({
            id: scan._id,
            type: scan.type,
            target:
              scan.type === 'email'
                ? (scan.target || 'Email content').slice(0, 80)
                : scan.target,
            result: scan.result?.riskLevel || 'safe',
            confidence: scan.result?.riskScore ?? 0,
            date: new Date(scan.createdAt).toLocaleDateString(),
          }))
        );
      } catch {
        toast.error('Could not load scan history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getRiskVariant = (result) => {
    if (result === 'dangerous') return 'danger';
    if (result === 'suspicious') return 'warning';
    return 'success';
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>Scan History</h1>
        <p>View your past scans and detections</p>
      </div>

      {loading ? (
        <p>Loading history...</p>
      ) : scans.length === 0 ? (
        <Card>
          <p>No scans yet. Use the URL or Email scanner to create your first scan.</p>
        </Card>
      ) : (
        <div className="scans-list">
          {scans.map((scan) => (
            <Card key={scan.id} className="scan-item">
              <div className="scan-main">
                <div className="scan-type">{scan.type.toUpperCase()}</div>
                <div className="scan-target">{scan.target}</div>
              </div>

              <div className="scan-meta" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Badge variant={getRiskVariant(scan.result)}>
                  {scan.result.toUpperCase()}
                </Badge>
                <span className="scan-confidence">{scan.confidence}%</span>
                <span className="scan-date">{scan.date}</span>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '4px 8px', fontSize: '12px', marginLeft: 'auto' }}
                  onClick={() => {
                    const token = localStorage.getItem('sentinelx_token');
                    const url = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/scan/${scan.id}/pdf`;
                    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                      .then(res => {
                        if (!res.ok) throw new Error('Failed to generate PDF');
                        return res.blob();
                      })
                      .then(blob => {
                        const blobUrl = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = `SentinelX_Report_${scan.id}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                      })
                      .catch(() => toast.error('Error downloading PDF report'));
                  }}
                >
                  Download PDF
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
