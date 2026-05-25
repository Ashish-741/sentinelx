/**
 * @fileoverview URL Scanner Page - Analyze URLs for phishing threats
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { scanURL, scanBatch } from '../services/api';
import { unwrap } from '../services/api';
import { Shield, ShieldAlert, Globe, Server, Link2, AlertTriangle } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import './ScannerPages.css';

export default function URLScannerPage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [batchResults, setBatchResults] = useState([]);

  const handleScan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await scanURL(url);
      const { scan } = unwrap(res);
      const r = scan.result || {};
      setResult({
        url: scan.target,
        riskLevel: r.riskLevel || 'safe',
        confidence: r.riskScore ?? Math.round((r.mlPrediction?.confidence || 0) * 100),
        threats: r.threats?.length ? r.threats : r.aiExplanation ? [r.aiExplanation] : [],
        explanation: r.aiExplanation || '',
        timestamp: scan.createdAt,
        enrichment: r.details?.enrichment || null,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'URL scan failed');
    } finally {
      setLoading(false);
    }
  };

  const getRadarData = (res) => {
    const e = res.enrichment;
    if (!e) return [];
    
    // Calculate 0-100 scores for vectors (higher = more risk)
    const reputationScore = res.confidence;
    const sslScore = (!e.ssl || !e.ssl.valid) ? 90 : (e.ssl.daysUntilExpiry < 30 ? 50 : 10);
    const dnsScore = e.dns?.resolved ? 10 : 80;
    const contentScore = e.content?.keywordsFound?.length > 0 ? Math.min(100, e.content.keywordsFound.length * 20) : 10;
    const redirectScore = e.redirects?.count > 0 ? 70 : 10;

    return [
      { subject: 'Reputation', A: reputationScore, fullMark: 100 },
      { subject: 'SSL Security', A: sslScore, fullMark: 100 },
      { subject: 'DNS Health', A: dnsScore, fullMark: 100 },
      { subject: 'Content Risk', A: contentScore, fullMark: 100 },
      { subject: 'Redirects', A: redirectScore, fullMark: 100 },
    ];
  };

  const handleFileUpload = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleBatchScan = async () => {
    if (!csvFile) return toast.error('Please select a CSV file');
    setLoading(true);
    setResult(null);
    setBatchResults([]);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const urls = text.split('\n').map(line => line.trim()).filter(line => line.length > 0 && line.startsWith('http'));
      if (urls.length === 0) {
        setLoading(false);
        return toast.error('No valid URLs found in CSV');
      }
      
      try {
        // Limit warning and slice before sending
        let urlsToScan = urls;
        if (urls.length > 50) {
          toast.error('Only the first 50 URLs will be scanned');
          urlsToScan = urls.slice(0, 50);
        }
        const res = await scanBatch(urlsToScan);
        const scans = res.data?.data?.scans || [];
        setBatchResults(scans);
        toast.success(`Batch scanned ${scans.length} URLs`);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Batch scan failed');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="scanner-page">
      <div className="scanner-header">
        <h1>URL Phishing Detector</h1>
        <p>Analyze URLs for phishing and malware threats</p>
      </div>

      <Card className="scanner-card">
        <form onSubmit={handleScan} className="scanner-form">
          <Input
            type="url"
            placeholder="Enter URL to scan (e.g., https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Scanning...' : 'Scan URL'}
          </Button>
        </form>
      </Card>

      <Card className="scanner-card" style={{ marginTop: '24px' }}>
        <h3 className="text-lg font-bold text-slate-200 mb-4">Batch Scan (CSV)</h3>
        <div className="flex gap-4 items-center">
          <input 
            type="file" 
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
          />
          <Button onClick={handleBatchScan} disabled={loading || !csvFile}>
            {loading ? 'Scanning...' : 'Upload & Scan'}
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2">CSV or TXT file with one URL per line. Max 50 URLs per batch.</p>
      </Card>

      {result && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Result Card */}
          <Card className="lg:col-span-1" glow={result.riskLevel === 'dangerous' ? 'red' : result.riskLevel === 'suspicious' ? 'warning' : 'green'}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${result.riskLevel === 'dangerous' ? 'border-danger text-danger bg-danger/10' : result.riskLevel === 'suspicious' ? 'border-warning text-warning bg-warning/10' : 'border-neon text-neon bg-neon/10'}`}>
                {result.riskLevel === 'dangerous' ? <ShieldAlert size={48} /> : <Shield size={48} />}
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{result.confidence}%</h2>
                <p className={`text-sm uppercase tracking-widest font-semibold mt-1 ${result.riskLevel === 'dangerous' ? 'text-danger' : result.riskLevel === 'suspicious' ? 'text-warning' : 'text-neon'}`}>
                  {result.riskLevel}
                </p>
              </div>
              {result.explanation && <p className="text-sm text-slate-400">{result.explanation}</p>}
            </div>

            {result.threats.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-warning" /> Detected Threats
                </h4>
                <ul className="space-y-2">
                  {result.threats.map((threat, i) => (
                    <li key={i} className="text-xs bg-slate-800/50 text-slate-300 px-3 py-2 rounded-md border border-slate-700/50">
                      {threat}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Visualization & Details */}
          {result.enrichment && (
            <div className="lg:col-span-2 space-y-6">
              {/* Radar Chart */}
              <Card>
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Threat Vector Analysis</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData(result)}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Risk" dataKey="A" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Enrichment Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="flex items-start gap-4 p-4">
                  <div className="p-2 bg-slate-800 rounded-lg"><Globe className="text-electric" size={20} /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">DNS & Domain</h4>
                    <p className="text-xs text-slate-400 mt-1">Resolved: {result.enrichment.dns.resolved ? 'Yes' : 'No'}</p>
                    {result.enrichment.dns.records?.length > 0 && (
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">Records: {result.enrichment.dns.records.join(', ')}</p>
                    )}
                  </div>
                </Card>

                <Card className="flex items-start gap-4 p-4">
                  <div className="p-2 bg-slate-800 rounded-lg"><Server className={result.enrichment.ssl?.valid ? 'text-neon' : 'text-danger'} size={20} /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">SSL Certificate</h4>
                    {result.enrichment.ssl ? (
                      <>
                        <p className="text-xs text-slate-400 mt-1">Issuer: {result.enrichment.ssl.issuer}</p>
                        <p className="text-xs text-slate-400">Status: {result.enrichment.ssl.valid ? 'Valid' : 'Invalid'}</p>
                        <p className="text-xs text-slate-400">Expires in: {result.enrichment.ssl.daysUntilExpiry} days</p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">No SSL Certificate detected</p>
                    )}
                  </div>
                </Card>

                <Card className="flex items-start gap-4 p-4">
                  <div className="p-2 bg-slate-800 rounded-lg"><Link2 className="text-purple" size={20} /></div>
                  <div className="w-full">
                    <h4 className="text-sm font-semibold text-slate-200">Redirects</h4>
                    <p className="text-xs text-slate-400 mt-1">Hops: {result.enrichment.redirects.count}</p>
                    {result.enrichment.redirects.chain.length > 0 && (
                      <div className="mt-2 text-[10px] bg-slate-900 p-2 rounded border border-slate-800 break-all">
                        {result.enrichment.redirects.chain.join(' → ')}
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="flex items-start gap-4 p-4">
                  <div className="p-2 bg-slate-800 rounded-lg"><AlertTriangle className="text-warning" size={20} /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Content Analysis</h4>
                    {result.enrichment.content?.keywordsFound?.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {result.enrichment.content.keywordsFound.map((kw, i) => (
                          <Badge key={i} variant="warning" className="text-[10px] py-0">{kw}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">No phishing keywords found</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {batchResults.length > 0 && (
        <Card className="result-card" style={{ marginTop: '24px' }}>
          <h3>Batch Scan Results</h3>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-2 font-medium">URL</th>
                  <th className="pb-2 font-medium">Risk Level</th>
                  <th className="pb-2 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {batchResults.map((scan) => (
                  <tr key={scan._id} className="border-b border-slate-800">
                    <td className="py-2 truncate max-w-[200px]" title={scan.target}>{scan.target}</td>
                    <td className="py-2">
                      <span className={`badge ${scan.result.riskLevel === 'dangerous' ? 'text-red-400' : scan.result.riskLevel === 'suspicious' ? 'text-yellow-400' : 'text-green-400'}`}>
                        {scan.result.riskLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2">{scan.result.riskScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
