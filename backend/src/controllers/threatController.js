/**
 * @fileoverview Threat intelligence controller – IP and domain lookups using
 * VirusTotal, AbuseIPDB, GeoIP, and WHOIS services with caching in ThreatReport.
 */

import ThreatReport from '../models/ThreatReport.js';
import * as virusTotal from '../services/virusTotal.js';
import * as abuseIPDB from '../services/abuseIPDB.js';
import * as geoIP from '../services/geoIP.js';
import * as whois from '../services/whois.js';
import logger from '../utils/logger.js';

// ────────────────────────────────────────────────────────────────────
// Mock / Demo Data
// ────────────────────────────────────────────────────────────────────

function getMockVTIPData(ip) {
  if (ip === '8.8.8.8' || ip === '1.1.1.1' || ip === '127.0.0.1') {
    return { ip, malicious: 0, suspicious: 0, harmless: 100, undetected: 0, reputation: 100, asOwner: 'Safe Network', network: `${ip}/24`, _demo: true };
  }
  const seed = ip.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const malicious = seed % 5;
  const suspicious = (seed * 2) % 10;
  return {
    ip,
    malicious,
    suspicious,
    harmless: 68 - malicious,
    undetected: 7,
    reputation: -malicious,
    asOwner: 'Demo Hosting Inc.',
    network: `${ip}/24`,
    _demo: true,
  };
}

function getMockVTDomainData(domain) {
  if (domain === 'google.com' || domain === 'github.com') {
    return { domain, malicious: 0, suspicious: 0, harmless: 100, undetected: 0, reputation: 100, registrar: 'Safe Registrar', creationDate: '1997-09-15', categories: {}, _demo: true };
  }
  const seed = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const malicious = seed % 4;
  const suspicious = (seed * 3) % 8;
  return {
    domain,
    malicious,
    suspicious,
    harmless: 72 - malicious,
    undetected: 6,
    reputation: 0,
    registrar: 'Demo Registrar',
    creationDate: '2019-01-15',
    categories: { 'Forcepoint ThreatSeeker': 'information technology' },
    _demo: true,
  };
}

function getMockAbuseData(ip) {
  if (ip === '8.8.8.8' || ip === '1.1.1.1' || ip === '127.0.0.1') {
    return { ipAddress: ip, isPublic: true, abuseConfidenceScore: 0, countryCode: 'US', isp: 'Safe ISP', domain: 'safe.com', totalReports: 0, _demo: true };
  }
  const seed = ip.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const abuseConfidenceScore = (seed * 3) % 40;
  return {
    ipAddress: ip,
    isPublic: true,
    abuseConfidenceScore,
    countryCode: 'US',
    isp: 'Demo ISP',
    domain: 'demo-hosting.com',
    totalReports: seed % 20,
    lastReportedAt: new Date().toISOString(),
    usageType: 'Data Center/Web Hosting/Transit',
    _demo: true,
  };
}

/**
 * Calculate an overall threat score from aggregated data.
 */
function calculateOverallScore({ vtData, abuseData }) {
  let score = 0;
  let factors = 0;

  if (vtData) {
    const vtMalicious = vtData.malicious || 0;
    const vtSuspicious = vtData.suspicious || 0;
    score += Math.min((vtMalicious * 10) + (vtSuspicious * 5), 60);
    factors++;
  }

  if (abuseData) {
    score += Math.min(abuseData.abuseConfidenceScore || 0, 40);
    factors++;
  }

  return factors > 0 ? Math.min(Math.round(score / factors), 100) : 0;
}

// ────────────────────────────────────────────────────────────────────
// Controllers
// ────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/threat/ip
 * @desc    Look up threat intelligence for an IP address
 * @access  Private
 */
export const lookupIP = async (req, res, next) => {
  try {
    const { ip } = req.body;

    // Check cache first
    const cached = await ThreatReport.findOne({ target: ip, type: 'ip' });
    if (cached) {
      logger.debug(`Returning cached threat report for IP: ${ip}`);
      return res.status(200).json({
        success: true,
        message: 'Threat report retrieved from cache.',
        data: { report: cached, cached: true },
      });
    }

    // Fetch from all sources in parallel
    const [vtData, abuseData, geoData] = await Promise.all([
      virusTotal.getIPReport(ip),
      abuseIPDB.checkIP(ip),
      geoIP.lookup(ip),
    ]);

    // Use real data or fall back to demo data
    const virusTotalData = vtData?.data?.attributes
      ? {
          malicious: vtData.data.attributes.last_analysis_stats?.malicious || 0,
          suspicious: vtData.data.attributes.last_analysis_stats?.suspicious || 0,
          harmless: vtData.data.attributes.last_analysis_stats?.harmless || 0,
          undetected: vtData.data.attributes.last_analysis_stats?.undetected || 0,
          reputation: vtData.data.attributes.reputation || 0,
          asOwner: vtData.data.attributes.as_owner || 'Unknown',
          network: vtData.data.attributes.network || '',
        }
      : getMockVTIPData(ip);

    const abuseIPDBData = abuseData || getMockAbuseData(ip);

    const overallScore = calculateOverallScore({
      vtData: virusTotalData,
      abuseData: abuseIPDBData,
    });

    // Save to cache
    const report = await ThreatReport.create({
      target: ip,
      type: 'ip',
      virusTotalData,
      abuseIPDBData,
      geoData,
      overallScore,
    });

    logger.info(`IP threat report generated for ${ip} – score: ${overallScore}`);

    res.status(200).json({
      success: true,
      message: 'IP threat report generated.',
      data: { report, cached: false },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/threat/domain
 * @desc    Look up threat intelligence for a domain
 * @access  Private
 */
export const lookupDomain = async (req, res, next) => {
  try {
    const { domain } = req.body;

    // Check cache first
    const cached = await ThreatReport.findOne({ target: domain, type: 'domain' });
    if (cached) {
      logger.debug(`Returning cached threat report for domain: ${domain}`);
      return res.status(200).json({
        success: true,
        message: 'Threat report retrieved from cache.',
        data: { report: cached, cached: true },
      });
    }

    // Fetch from all sources in parallel
    const [vtData, whoisData] = await Promise.all([
      virusTotal.getDomainReport(domain),
      whois.lookupDomain(domain),
    ]);

    // Use real data or fall back to demo data
    const virusTotalData = vtData?.data?.attributes
      ? {
          malicious: vtData.data.attributes.last_analysis_stats?.malicious || 0,
          suspicious: vtData.data.attributes.last_analysis_stats?.suspicious || 0,
          harmless: vtData.data.attributes.last_analysis_stats?.harmless || 0,
          undetected: vtData.data.attributes.last_analysis_stats?.undetected || 0,
          reputation: vtData.data.attributes.reputation || 0,
          registrar: vtData.data.attributes.registrar || 'Unknown',
          creationDate: vtData.data.attributes.creation_date || null,
          categories: vtData.data.attributes.categories || {},
        }
      : getMockVTDomainData(domain);

    const overallScore = calculateOverallScore({
      vtData: virusTotalData,
      abuseData: null,
    });

    // Save to cache
    const report = await ThreatReport.create({
      target: domain,
      type: 'domain',
      virusTotalData,
      whoisData,
      overallScore,
    });

    logger.info(
      `Domain threat report generated for ${domain} – score: ${overallScore}`
    );

    res.status(200).json({
      success: true,
      message: 'Domain threat report generated.',
      data: { report, cached: false },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/threat/feed
 * @desc    Get recent threat reports
 * @access  Private
 */
export const getThreatFeed = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const reports = await ThreatReport.find()
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.status(200).json({
      success: true,
      data: { reports, total: reports.length },
    });
  } catch (error) {
    next(error);
  }
};

export default { lookupIP, lookupDomain, getThreatFeed };
