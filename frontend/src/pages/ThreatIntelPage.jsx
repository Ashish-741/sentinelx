/**
 * @fileoverview Threat Intelligence Page - IP and domain lookups
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { lookupThreatIP, lookupThreatDomain } from '../services/api';
import { unwrap } from '../services/api';
import './ThreatIntelPage.css';

export default function ThreatIntelPage() {
  const [queryType, setQueryType] = useState('ip');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res =
        queryType === 'ip'
          ? await lookupThreatIP(query.trim())
          : await lookupThreatDomain(query.trim());
      const { report } = unwrap(res);

      const abuse = report.abuseIPDBData || {};
      const vt = report.virusTotalData || {};

      setResult({
        type: queryType,
        value: report.target,
        reputation:
          (report.overallScore ?? 0) >= 60
            ? 'malicious'
            : (report.overallScore ?? 0) >= 30
              ? 'suspicious'
              : 'clean',
        abuseScore: abuse.abuseConfidenceScore ?? report.overallScore ?? 0,
        country: report.geoData?.country || abuse.countryCode || 'N/A',
        reports: abuse.totalReports ?? vt.malicious ?? 0,
        overallScore: report.overallScore ?? 0,
        lastReport: abuse.lastReportedAt
          ? new Date(abuse.lastReportedAt).toLocaleDateString()
          : 'N/A',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Threat lookup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="threat-intel-page">
      <div className="threat-header">
        <h1>Threat Intelligence Lookup</h1>
        <p>Investigate IP addresses and domains</p>
      </div>

      <Card className="lookup-card">
        <form onSubmit={handleLookup}>
          <div className="query-type-selector">
            <label>
              <input
                type="radio"
                value="ip"
                checked={queryType === 'ip'}
                onChange={(e) => setQueryType(e.target.value)}
              />
              IP Address
            </label>
            <label>
              <input
                type="radio"
                value="domain"
                checked={queryType === 'domain'}
                onChange={(e) => setQueryType(e.target.value)}
              />
              Domain
            </label>
          </div>

          <Input
            type="text"
            placeholder={queryType === 'ip' ? 'Enter IP address' : 'Enter domain name'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Lookup'}
          </Button>
        </form>
      </Card>

      {result && (
        <Card className="result-card">
          <h3>Threat Report — {result.value}</h3>
          <Badge
            variant={
              result.reputation === 'malicious'
                ? 'danger'
                : result.reputation === 'suspicious'
                  ? 'warning'
                  : 'success'
            }
          >
            {result.reputation.toUpperCase()}
          </Badge>
          <div className="threat-details">
            <p>Overall threat score: {result.overallScore}/100</p>
            <p>Abuse confidence: {result.abuseScore}%</p>
            <p>Country: {result.country}</p>
            <p>Reports: {result.reports}</p>
            <p>Last reported: {result.lastReport}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
