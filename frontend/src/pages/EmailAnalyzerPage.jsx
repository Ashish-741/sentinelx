/**
 * @fileoverview Email Analyzer Page - Analyze emails for phishing
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { scanEmail } from '../services/api';
import { unwrap } from '../services/api';
import { ShieldCheck, ShieldAlert, AlertTriangle, Fingerprint, MailWarning } from 'lucide-react';
import './ScannerPages.css';

export default function EmailAnalyzerPage() {
  const [emailText, setEmailText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await scanEmail(emailText);
      const { scan } = unwrap(res);
      const r = scan.result || {};
      const indicators =
        r.threats?.length > 0
          ? r.threats
          : r.mlPrediction?.indicators || [];

      setResult({
        riskLevel: r.riskLevel || 'safe',
        confidence: r.riskScore ?? Math.round((r.mlPrediction?.confidence || 0) * 100),
        indicators,
        explanation: r.aiExplanation || '',
        timestamp: scan.createdAt,
        headerAnalysis: r.details?.headerAnalysis || null,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-page">
      <div className="scanner-header">
        <h1>Email Phishing Analyzer</h1>
        <p>Detect phishing and social engineering attempts</p>
      </div>

      <Card className="scanner-card">
        <form onSubmit={handleAnalyze} className="scanner-form">
          <p className="text-sm text-slate-400 mb-2">Paste raw email headers or body content for analysis. Raw headers enable spoofing detection.</p>
          <textarea
            placeholder="e.g. Return-Path: <hacker@evil.com>&#10;From: CEO <ceo@company.com>&#10;...or paste body text here..."
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            rows="10"
            className="email-textarea"
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Email'}
          </Button>
        </form>
      </Card>

      {result && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1" glow={result.riskLevel === 'dangerous' ? 'red' : result.riskLevel === 'suspicious' ? 'warning' : 'green'}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${result.riskLevel === 'dangerous' ? 'border-danger text-danger bg-danger/10' : result.riskLevel === 'suspicious' ? 'border-warning text-warning bg-warning/10' : 'border-neon text-neon bg-neon/10'}`}>
                {result.riskLevel === 'dangerous' ? <ShieldAlert size={48} /> : <ShieldCheck size={48} />}
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{result.confidence}%</h2>
                <p className={`text-sm uppercase tracking-widest font-semibold mt-1 ${result.riskLevel === 'dangerous' ? 'text-danger' : result.riskLevel === 'suspicious' ? 'text-warning' : 'text-neon'}`}>
                  {result.riskLevel}
                </p>
              </div>
              {result.explanation && <p className="text-sm text-slate-400">{result.explanation}</p>}
            </div>

            {result.indicators.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-warning" /> Risk Indicators
                </h4>
                <ul className="space-y-2">
                  {result.indicators.map((item, i) => (
                    <li key={i} className="text-xs bg-slate-800/50 text-slate-300 px-3 py-2 rounded-md border border-slate-700/50">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {result.headerAnalysis ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="md:col-span-2 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Fingerprint className="text-purple" size={24} />
                    <h3 className="text-lg font-bold text-slate-200">Header Authentication</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-center">
                      <p className="text-xs text-slate-400 mb-1 font-bold">SPF</p>
                      <Badge variant={result.headerAnalysis.spf === 'pass' ? 'success' : result.headerAnalysis.spf === 'fail' ? 'danger' : 'warning'}>
                        {result.headerAnalysis.spf.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-center">
                      <p className="text-xs text-slate-400 mb-1 font-bold">DKIM</p>
                      <Badge variant={result.headerAnalysis.dkim === 'pass' ? 'success' : result.headerAnalysis.dkim === 'fail' ? 'danger' : 'warning'}>
                        {result.headerAnalysis.dkim.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-center">
                      <p className="text-xs text-slate-400 mb-1 font-bold">DMARC</p>
                      <Badge variant={result.headerAnalysis.dmarc === 'pass' ? 'success' : result.headerAnalysis.dmarc === 'fail' ? 'danger' : 'warning'}>
                        {result.headerAnalysis.dmarc.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </Card>

                <Card className={`p-4 md:col-span-2 border ${result.headerAnalysis.isSpoofed ? 'border-danger/50 bg-danger/5' : 'border-slate-700/50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${result.headerAnalysis.isSpoofed ? 'bg-danger/20 text-danger' : 'bg-slate-800 text-neon'}`}>
                      {result.headerAnalysis.isSpoofed ? <AlertTriangle size={20} /> : <MailWarning size={20} />}
                    </div>
                    <div className="w-full">
                      <h4 className="text-sm font-semibold text-slate-200">Spoofing Detection</h4>
                      <p className="text-xs text-slate-400 mt-1 mb-3">Comparing 'From' address to hidden 'Return-Path' routing.</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide">From Domain</p>
                          <p className={`text-sm truncate ${result.headerAnalysis.isSpoofed ? 'text-warning' : 'text-slate-300'}`}>
                            {result.headerAnalysis.fromDomain || 'Unknown'}
                          </p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Return-Path Domain</p>
                          <p className={`text-sm truncate ${result.headerAnalysis.isSpoofed ? 'text-danger' : 'text-slate-300'}`}>
                            {result.headerAnalysis.returnPathDomain || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      {result.headerAnalysis.isSpoofed && (
                        <p className="text-xs text-danger mt-3 font-semibold bg-danger/10 p-2 rounded border border-danger/20">
                          ⚠️ HIGH RISK: The sender's display address is spoofed. Replies will route to a different domain.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="flex items-center justify-center p-8 text-center text-slate-400 border-dashed border-slate-700">
                <div>
                  <MailWarning size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No email headers detected.</p>
                  <p className="text-xs mt-2 max-w-sm mx-auto">Paste raw email headers (including 'Received', 'Authentication-Results', etc.) to enable advanced spoofing detection and SPF/DKIM validation.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
