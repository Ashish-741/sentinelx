/**
 * @fileoverview Scan controller – URL and email phishing analysis with ML service
 * integration and heuristic fallback when the ML service is unavailable.
 */

import Scan from '../models/Scan.js';
import User from '../models/User.js';
import { predictURL, analyzeEmail } from '../services/mlService.js';
import logger from '../utils/logger.js';
import { getIO } from '../utils/socket.js';
import dns from 'dns/promises';
import tls from 'tls';
import axios from 'axios';

// ────────────────────────────────────────────────────────────────────
// Fallback Heuristic & Enrichment Helpers
// ────────────────────────────────────────────────────────────────────

async function enrichUrlData(targetUrl) {
  const enrichment = {
    dns: { resolved: false, records: [] },
    ssl: { valid: false, issuer: 'Unknown', daysUntilExpiry: 0 },
    redirects: { count: 0, chain: [] },
    content: { keywordsFound: [] },
    domainAge: 'Unknown (Mocked API)',
  };

  try {
    const parsedUrl = new URL(targetUrl);
    const hostname = parsedUrl.hostname;

    // 1. DNS Lookup
    try {
      const records = await dns.resolve(hostname);
      enrichment.dns.resolved = true;
      enrichment.dns.records = Array.isArray(records) ? records.slice(0, 3) : [records];
    } catch (e) {
      try {
        const { address } = await dns.lookup(hostname);
        enrichment.dns.resolved = true;
        enrichment.dns.records = [address];
      } catch (e2) {}
    }

    // 2. SSL Info
    if (parsedUrl.protocol === 'https:') {
      try {
        const certInfo = await new Promise((resolve, reject) => {
          const socket = tls.connect({
            host: hostname,
            port: 443,
            servername: hostname,
            rejectUnauthorized: false
          }, () => {
            const cert = socket.getPeerCertificate();
            socket.end();
            if (cert && cert.valid_to) {
              const expiry = new Date(cert.valid_to);
              const days = Math.floor((expiry - new Date()) / (1000 * 60 * 60 * 24));
              resolve({
                valid: socket.authorized,
                issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown',
                daysUntilExpiry: days
              });
            } else {
              resolve(null);
            }
          });
          socket.on('error', reject);
        });
        if (certInfo) enrichment.ssl = certInfo;
      } catch (e) {}
    }

    // 3. Content & Redirects
    try {
      const response = await axios.get(targetUrl, { 
        timeout: 5000,
        maxRedirects: 3,
        validateStatus: () => true 
      });

      const finalUrl = response.request?.res?.responseUrl || targetUrl;
      if (finalUrl !== targetUrl) {
        enrichment.redirects.count = 1;
        enrichment.redirects.chain = [targetUrl, finalUrl];
      }

      if (typeof response.data === 'string') {
        const htmlLower = response.data.toLowerCase();
        enrichment.content.keywordsFound = SUSPICIOUS_KEYWORDS.filter(kw => htmlLower.includes(kw));
      }
    } catch (e) {}

  } catch (err) {
    logger.error(`Enrichment failed for ${targetUrl}: ${err.message}`);
  }

  return enrichment;
}

const SUSPICIOUS_KEYWORDS = [
  'login', 'verify', 'secure', 'account', 'update', 'banking',
  'paypal', 'confirm', 'suspend', 'password', 'credential', 'urgent',
  'click here', 'act now', 'limited time', 'free', 'winner',
];

const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
  'is.gd', 'buff.ly', 'adf.ly', 'bl.ink', 'short.io',
];

const URGENCY_WORDS = [
  'urgent', 'immediately', 'asap', 'right away', 'act now',
  'limited time', 'expire', 'suspend', 'terminate', 'unauthorized',
  'unusual activity', 'verify now', 'confirm now',
];

const CREDENTIAL_WORDS = [
  'password', 'username', 'ssn', 'social security', 'credit card',
  'bank account', 'pin', 'cvv', 'routing number', 'login',
  'credentials', 'sign in', 'verify your identity',
];

/**
 * Perform heuristic URL analysis when the ML service is unavailable.
 * @param {string} url
 * @returns {Object} { riskScore, riskLevel, threats, details }
 */
function fallbackURLAnalysis(url) {
  const threats = [];
  let score = 0;
  const urlLower = url.toLowerCase();

  // 1. URL length check
  if (url.length > 75) {
    score += 15;
    threats.push('Unusually long URL');
  }

  // 2. IP address in URL
  const ipPattern = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
  if (ipPattern.test(url)) {
    score += 25;
    threats.push('URL contains an IP address instead of a domain');
  }

  // 3. HTTPS check
  if (!url.startsWith('https://')) {
    score += 10;
    threats.push('URL does not use HTTPS');
  }

  // 4. Suspicious keywords
  const foundKeywords = SUSPICIOUS_KEYWORDS.filter((kw) => urlLower.includes(kw));
  if (foundKeywords.length > 0) {
    score += Math.min(foundKeywords.length * 8, 25);
    threats.push(`Suspicious keywords detected: ${foundKeywords.join(', ')}`);
  }

  // 5. URL shortener
  const isShortener = URL_SHORTENERS.some((s) => urlLower.includes(s));
  if (isShortener) {
    score += 15;
    threats.push('URL uses a known URL shortener');
  }

  // 6. Excessive subdomains (>3 dots in hostname)
  try {
    const hostname = new URL(url).hostname;
    const dotCount = (hostname.match(/\./g) || []).length;
    if (dotCount > 3) {
      score += 15;
      threats.push('Excessive subdomains detected');
    }
  } catch {
    score += 5;
    threats.push('Unable to parse URL hostname');
  }

  // 7. Special characters (@ symbol – credential harvesting pattern)
  if (url.includes('@')) {
    score += 20;
    threats.push('URL contains @ symbol – possible credential harvesting');
  }

  // 8. Homograph / punycode
  if (url.includes('xn--')) {
    score += 15;
    threats.push('Internationalized domain name (punycode) detected');
  }

  // Clamp score
  score = Math.min(score, 100);
  const riskLevel = score >= 60 ? 'dangerous' : score >= 30 ? 'suspicious' : 'safe';

  return {
    riskScore: score,
    riskLevel,
    threats,
    details: {
      urlLength: url.length,
      usesHTTPS: url.startsWith('https://'),
      foundKeywords: foundKeywords?.length || 0,
      isShortener,
      analysisMethod: 'heuristic_fallback',
    },
  };
}

/**
 * Perform basic email phishing keyword analysis when the ML service is unavailable.
 * @param {string} text
 * @returns {Object} { riskScore, riskLevel, threats, details }
 */
function fallbackEmailAnalysis(text) {
  const threats = [];
  let score = 0;
  const textLower = text.toLowerCase();

  // 1. Urgency words
  const urgency = URGENCY_WORDS.filter((w) => textLower.includes(w));
  if (urgency.length > 0) {
    score += Math.min(urgency.length * 10, 30);
    threats.push(`Urgency language detected: ${urgency.join(', ')}`);
  }

  // 2. Credential-related words
  const credential = CREDENTIAL_WORDS.filter((w) => textLower.includes(w));
  if (credential.length > 0) {
    score += Math.min(credential.length * 10, 30);
    threats.push(`Credential-related language: ${credential.join(', ')}`);
  }

  // 3. Suspicious link patterns
  const linkPattern = /https?:\/\/[^\s]+/g;
  const links = text.match(linkPattern) || [];
  if (links.length > 3) {
    score += 10;
    threats.push(`Multiple links found (${links.length})`);
  }
  // Check for mismatched display vs actual links
  links.forEach((link) => {
    if (URL_SHORTENERS.some((s) => link.includes(s))) {
      score += 10;
      threats.push('Email contains shortened URLs');
    }
  });

  // 4. Generic greeting
  const genericGreeting = /dear (customer|user|member|sir|madam|valued)/i;
  if (genericGreeting.test(text)) {
    score += 10;
    threats.push('Generic greeting used (common in phishing)');
  }

  // 5. Spelling / grammar indicators
  const spamPatterns = ['click below', 'click here', 'act now', 'congratulations'];
  const spamFound = spamPatterns.filter((p) => textLower.includes(p));
  if (spamFound.length > 0) {
    score += spamFound.length * 5;
    threats.push(`Spam-like phrases: ${spamFound.join(', ')}`);
  }

  score = Math.min(score, 100);
  const riskLevel = score >= 60 ? 'dangerous' : score >= 30 ? 'suspicious' : 'safe';

  return {
    riskScore: score,
    riskLevel,
    threats,
    details: {
      urgencyWordsCount: urgency.length,
      credentialWordsCount: credential.length,
      linksCount: links.length,
      textLength: text.length,
      analysisMethod: 'keyword_fallback',
    },
  };
}

/**
 * Extract and analyze raw email headers for SPF, DKIM, DMARC and Spoofing
 * @param {string} text 
 * @returns {Object|null}
 */
function parseEmailHeaders(text) {
  const headersFound = /^From:/mi.test(text) || /^Received:/mi.test(text);
  if (!headersFound) return null;

  const result = {
    hasHeaders: true,
    spf: 'none',
    dkim: 'none',
    dmarc: 'none',
    fromDomain: null,
    returnPathDomain: null,
    isSpoofed: false
  };

  // Extract Authentication-Results
  const authResultsMatch = text.match(/Authentication-Results:(.*?)(?:\n\S|\n\n|$)/is);
  if (authResultsMatch) {
    const authString = authResultsMatch[1].toLowerCase();
    
    const spfMatch = authString.match(/spf=(pass|fail|softfail|neutral|none|temperror|permerror)/);
    if (spfMatch) result.spf = spfMatch[1];
    
    const dkimMatch = authString.match(/dkim=(pass|fail|neutral|none|temperror|permerror)/);
    if (dkimMatch) result.dkim = dkimMatch[1];
    
    const dmarcMatch = authString.match(/dmarc=(pass|fail|bestguesspass|none)/);
    if (dmarcMatch) result.dmarc = dmarcMatch[1];
  }

  // Extract From Domain
  const fromMatch = text.match(/^From:.*?<([^>]+)>|From:\s*([^\s<]+@[^\s>]+)/mi);
  if (fromMatch) {
    const email = fromMatch[1] || fromMatch[2];
    if (email && email.includes('@')) {
      result.fromDomain = email.split('@')[1].trim().toLowerCase();
    }
  }

  // Extract Return-Path Domain
  const returnPathMatch = text.match(/^Return-Path:.*?<([^>]+)>|Return-Path:\s*([^\s<]+@[^\s>]+)/mi);
  if (returnPathMatch) {
    const email = returnPathMatch[1] || returnPathMatch[2];
    if (email && email.includes('@')) {
      result.returnPathDomain = email.split('@')[1].trim().toLowerCase();
    }
  }

  // Spoofing detection (Mismatch between From and Return-Path)
  if (result.fromDomain && result.returnPathDomain) {
    if (!result.fromDomain.endsWith(result.returnPathDomain) && !result.returnPathDomain.endsWith(result.fromDomain)) {
      result.isSpoofed = true;
    }
  }

  return result;
}

// ────────────────────────────────────────────────────────────────────
// Controllers
// ────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/scan/url
 * @desc    Scan a URL for phishing threats
 * @access  Private
 */
export const scanURL = async (req, res, next) => {
  try {
    const { url } = req.body;

    // Create pending scan
    const scan = new Scan({
      userId: req.user._id,
      type: 'url',
      target: url,
      status: 'pending',
    });

    // Try ML service first
    let result;
    const mlResult = await predictURL(url);

    if (mlResult) {
      const riskScore = mlResult.risk_score ?? mlResult.riskScore ?? 0;
      let riskLevel =
        mlResult.risk_level ||
        (riskScore >= 60 ? 'dangerous' : riskScore >= 30 ? 'suspicious' : 'safe');
      if (riskLevel === 'critical') riskLevel = 'dangerous';

      const featureMap = {
        url_length: { text: 'Unusually long URL length', isThreat: (v) => v > 75 },
        num_dots: { text: 'Multiple subdomains (dots) detected', isThreat: (v) => v > 3 },
        num_slashes: { text: 'Deep path structure (many slashes)', isThreat: (v) => v > 5 },
        path_length: { text: 'Unusually long path length', isThreat: (v) => v > 50 },
        has_https: { text: 'Missing HTTPS (Insecure)', isThreat: (v) => !v },
        domain_length: { text: 'Long domain name', isThreat: (v) => v > 30 },
        has_suspicious_tld: { text: 'Suspicious Top-Level Domain (TLD)', isThreat: (v) => v === true || v > 0 },
        entropy: { text: 'High character randomness (Entropy)', isThreat: (v) => v > 4.5 },
        domain_age_days: { text: 'Recently registered domain', isThreat: (v) => v > 0 && v < 30 },
        is_ip: { text: 'URL uses an IP address instead of a domain name', isThreat: (v) => v === true || v > 0 },
        has_at_symbol: { text: 'Contains @ symbol (Credential Harvesting)', isThreat: (v) => v === true || v > 0 },
        has_hyphen_domain: { text: 'Domain contains hyphens (Common in phishing)', isThreat: (v) => v === true || v > 0 },
      };

      let mappedThreats = mlResult.threats || [];
      if (mappedThreats.length === 0 && mlResult.features) {
        Object.entries(mlResult.features).forEach(([k, v]) => {
          if (featureMap[k] && featureMap[k].isThreat(v)) {
            mappedThreats.push(featureMap[k].text);
          } else if (!featureMap[k] && v === true) {
            mappedThreats.push(k.replace(/_/g, ' '));
          }
        });
      }

      result = {
        riskScore,
        riskLevel,
        threats: mappedThreats,
        details: mlResult.features || mlResult.details || {},
        mlPrediction: mlResult,
        aiExplanation: mlResult.explanation || mlResult.ai_explanation || '',
      };
    } else {
      // Fallback heuristic analysis
      logger.info('ML service unavailable – using fallback URL analysis');
      const heuristic = fallbackURLAnalysis(url);
      result = {
        ...heuristic,
        mlPrediction: null,
        aiExplanation:
          'Analysis performed using heuristic rules (ML service unavailable).',
      };
    }

    // --- NEW: Augment with Real-Time Data Visualization Metrics ---
    const enrichment = await enrichUrlData(url);
    result.details.enrichment = enrichment;
    
    // Adjust risk based on enrichment
    if (!enrichment.ssl.valid && url.startsWith('https')) {
      result.threats.push('Invalid SSL Certificate');
      result.riskScore = Math.min(100, result.riskScore + 15);
    }
    if (enrichment.redirects.count > 0) {
      result.threats.push('URL Redirects to another destination');
    }
    if (enrichment.content.keywordsFound.length > 0) {
      result.riskScore = Math.min(100, result.riskScore + (enrichment.content.keywordsFound.length * 5));
    }
    result.riskLevel = result.riskScore >= 60 ? 'dangerous' : result.riskScore >= 30 ? 'suspicious' : 'safe';
    // --------------------------------------------------------------

    scan.result = result;
    scan.status = 'completed';
    await scan.save();

    // Increment user scan count
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalScans: 1 } });

    logger.info(
      `URL scan completed: ${url} → ${result.riskLevel} (${result.riskScore})`
    );

    // Emit live threat event globally and to the specific user
    const io = getIO();
    const eventPayload = {
      id: scan._id,
      type: 'url',
      target: url,
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      timestamp: new Date().toISOString()
    };
    if (io) {
      io.emit('new_threat', eventPayload);
      io.to(req.user._id.toString()).emit('scan_complete', eventPayload);
    }

    res.status(200).json({
      success: true,
      message: 'URL scan completed.',
      data: { scan },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/scan/email
 * @desc    Scan email text for phishing indicators
 * @access  Private
 */
export const scanEmail = async (req, res, next) => {
  try {
    const { text } = req.body;

    // Create pending scan
    const scan = new Scan({
      userId: req.user._id,
      type: 'email',
      target: text.substring(0, 200), // store first 200 chars as target
      status: 'pending',
    });

    // Try ML service first (limit text to 100,000 characters to prevent timeouts)
    let result;
    const mlText = text.length > 100000 ? text.substring(0, 100000) : text;
    const mlResult = await analyzeEmail(mlText);

    if (mlResult) {
      const riskScore = mlResult.risk_score ?? mlResult.riskScore ?? 0;
      let riskLevel =
        mlResult.risk_level ||
        (riskScore >= 60 ? 'dangerous' : riskScore >= 30 ? 'suspicious' : 'safe');
      if (riskLevel === 'critical') riskLevel = 'dangerous';

      result = {
        riskScore,
        riskLevel,
        threats: mlResult.indicators || mlResult.threats || [],
        details: mlResult.categories || mlResult.details || {},
        mlPrediction: mlResult,
        aiExplanation: mlResult.explanation || mlResult.ai_explanation || '',
      };
    } else {
      logger.info('ML service unavailable – using fallback email analysis');
      const heuristic = fallbackEmailAnalysis(text);
      result = {
        ...heuristic,
        mlPrediction: null,
        aiExplanation:
          'Analysis performed using keyword rules (ML service unavailable).',
      };
    }

    // --- NEW: Cross-Reference Email URLs with URL ML Model ---
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    const urlPredictions = [];

    if (urls.length > 0) {
      // Deduplicate and limit to top 5 to prevent timeouts
      const uniqueUrls = [...new Set(urls)].slice(0, 5);
      for (const u of uniqueUrls) {
        try {
          const p = await predictURL(u);
          if (p) urlPredictions.push({ url: u, ...p });
        } catch (e) {
          logger.error(`Error cross-referencing URL ${u}: ${e.message}`);
        }
      }
    }

    if (urlPredictions.length > 0) {
      result.details.urlsFound = urls.length;
      result.details.urlsScanned = urlPredictions.length;
      
      let maxUrlRisk = 0;
      for (const p of urlPredictions) {
        const urlRisk = p.risk_score ?? p.riskScore ?? 0;
        if (urlRisk > maxUrlRisk) maxUrlRisk = urlRisk;
        
        if (urlRisk >= 50) {
          const threatMsg = `Malicious URL embedded: ${p.url} (${urlRisk}% risk)`;
          if (!result.threats.includes(threatMsg)) {
            result.threats.push(threatMsg);
          }
        }
      }
      
      if (maxUrlRisk > result.riskScore) {
        result.riskScore = maxUrlRisk;
        result.riskLevel = result.riskScore >= 60 ? 'dangerous' : result.riskScore >= 30 ? 'suspicious' : 'safe';
        if (!result.aiExplanation.includes('links were analyzed')) {
          result.aiExplanation += ' Embedded links were analyzed and found to be highly suspicious or malicious, boosting the overall threat score.';
        }
      }
    }

    // --- NEW: Email Header & Spoofing Analysis ---
    const headerAnalysis = parseEmailHeaders(text);
    if (headerAnalysis) {
      result.details.headerAnalysis = headerAnalysis;
      
      let scoreIncrease = 0;
      if (headerAnalysis.isSpoofed) {
        scoreIncrease += 40;
        const msg = `Spoofing Detected: 'From' domain (${headerAnalysis.fromDomain}) does not match 'Return-Path' (${headerAnalysis.returnPathDomain})`;
        if (!result.threats.includes(msg)) result.threats.push(msg);
      }
      
      if (headerAnalysis.spf === 'fail' || headerAnalysis.spf === 'softfail') {
        scoreIncrease += 20;
        const msg = `SPF Authentication Failed (${headerAnalysis.spf})`;
        if (!result.threats.includes(msg)) result.threats.push(msg);
      }
      
      if (headerAnalysis.dkim === 'fail') {
        scoreIncrease += 20;
        if (!result.threats.includes('DKIM Signature Invalid or Failed')) result.threats.push('DKIM Signature Invalid or Failed');
      }
      
      if (headerAnalysis.dmarc === 'fail') {
        scoreIncrease += 20;
        if (!result.threats.includes('DMARC Policy Failed')) result.threats.push('DMARC Policy Failed');
      }

      // If everything passes perfectly, it's a highly trusted sender. 
      // Reduce the ML false-positive risk score significantly.
      if (!headerAnalysis.isSpoofed && headerAnalysis.spf === 'pass' && headerAnalysis.dkim === 'pass' && headerAnalysis.dmarc === 'pass') {
        result.riskScore = Math.max(0, result.riskScore - 40); // Reduce risk by 40 points
        if (!result.aiExplanation.includes('Authenticated')) {
          result.aiExplanation += ' Cryptographic headers (SPF/DKIM/DMARC) passed. Sender identity is verified, lowering risk score.';
        }
        // Remove minor ML threats if fully authenticated
        result.threats = result.threats.filter(t => !['password', 'urgent'].includes(t.toLowerCase()));
      }

      if (scoreIncrease > 0) {
        result.riskScore = Math.min(100, result.riskScore + scoreIncrease);
      }
      
      // Always forcefully recalculate risk level based on final score
      result.riskLevel = result.riskScore >= 60 ? 'dangerous' : result.riskScore >= 30 ? 'suspicious' : 'safe';
    }
    // ---------------------------------------------

    // Force recalculate level in case ML returned 'dangerous' but score is low
    if (!headerAnalysis) {
      result.riskLevel = result.riskScore >= 60 ? 'dangerous' : result.riskScore >= 30 ? 'suspicious' : 'safe';
    }

    scan.result = result;
    scan.metadata = { textLength: text.length, fullText: text };
    scan.status = 'completed';
    await scan.save();

    // Increment user scan count
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalScans: 1 } });

    logger.info(
      `Email scan completed → ${result.riskLevel} (${result.riskScore})`
    );

    // Emit live threat event globally and to the specific user
    const io = getIO();
    const eventPayload = {
      id: scan._id,
      type: 'email',
      target: 'Email Content',
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      timestamp: new Date().toISOString()
    };
    if (io) {
      io.emit('new_threat', eventPayload);
      io.to(req.user._id.toString()).emit('scan_complete', eventPayload);
    }

    res.status(200).json({
      success: true,
      message: 'Email scan completed.',
      data: { scan },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/scan/history
 * @desc    Get paginated scan history for the authenticated user
 * @access  Private
 */
export const getScanHistory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      riskLevel,
      startDate,
      endDate,
    } = req.query;

    const filter = { userId: req.user._id, isDeleted: false };

    if (type) filter.type = type;
    if (riskLevel) filter['result.riskLevel'] = riskLevel;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [scans, total] = await Promise.all([
      Scan.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Scan.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        scans,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/scan/:id
 * @desc    Get a single scan by ID
 * @access  Private
 */
export const getScanById = async (req, res, next) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: false,
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: { scan },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/scan/:id
 * @desc    Soft-delete a scan
 * @access  Private
 */
export const deleteScan = async (req, res, next) => {
  try {
    const scan = await Scan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Scan deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/scan/batch
 * @desc    Scan an array of URLs from a CSV
 * @access  Private
 */
export const scanBatch = async (req, res, next) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of URLs.' });
    }
    
    // Limit to 50 per batch
    const batchUrls = urls.slice(0, 50);
    const results = [];
    
    for (const u of batchUrls) {
      try {
        const mlResult = await predictURL(u);
        let riskScore, riskLevel, threats, details, aiExplanation;
        
        if (mlResult) {
          riskScore = mlResult.risk_score ?? mlResult.riskScore ?? 0;
          riskLevel = mlResult.risk_level || (riskScore >= 60 ? 'dangerous' : riskScore >= 30 ? 'suspicious' : 'safe');
          if (riskLevel === 'critical') riskLevel = 'dangerous';
          threats = mlResult.indicators || mlResult.threats || [];
          details = mlResult.categories || {};
          aiExplanation = mlResult.explanation || '';
        } else {
          const fallback = fallbackURLAnalysis(u);
          riskScore = fallback.riskScore;
          riskLevel = fallback.riskLevel;
          threats = fallback.threats;
          details = fallback.details;
          aiExplanation = 'Analysis performed using heuristic rules (ML service unavailable).';
        }
        
        const scan = await Scan.create({
          userId: req.user._id,
          type: 'url',
          target: u,
          status: 'completed',
          result: {
            riskScore,
            riskLevel,
            threats,
            details,
            aiExplanation
          }
        });
        
        results.push(scan);
      } catch (err) {
        logger.error(`Batch scan failed for URL ${u}: ${err.message}`);
      }
    }
    
    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalScans: results.length } });
    
    res.status(200).json({
      success: true,
      message: `Batch scan complete for ${results.length} URLs.`,
      data: { scans: results }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  scanURL,
  scanEmail,
  getScanHistory,
  getScanById,
  deleteScan,
};
