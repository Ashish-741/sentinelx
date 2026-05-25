/**
 * @fileoverview AbuseIPDB API service – IP reputation lookups.
 * @see https://docs.abuseipdb.com/
 */

import axios from 'axios';
import logger from '../utils/logger.js';

const ABUSE_BASE = 'https://api.abuseipdb.com/api/v2';

/**
 * Check an IP address against AbuseIPDB.
 * @param {string} ip - IPv4 or IPv6 address
 * @returns {Promise<Object|null>} Report object or null if unavailable
 */
export async function checkIP(ip) {
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey) {
    logger.debug('AbuseIPDB API key not configured – returning null');
    return null;
  }

  try {
    const { data } = await axios.get(`${ABUSE_BASE}/check`, {
      params: {
        ipAddress: ip,
        maxAgeInDays: 90,
        verbose: true,
      },
      headers: {
        Key: apiKey,
        Accept: 'application/json',
      },
      timeout: 10_000,
    });

    const d = data?.data;
    return {
      ipAddress: d?.ipAddress,
      isPublic: d?.isPublic,
      abuseConfidenceScore: d?.abuseConfidenceScore,
      countryCode: d?.countryCode,
      isp: d?.isp,
      domain: d?.domain,
      totalReports: d?.totalReports,
      lastReportedAt: d?.lastReportedAt,
      usageType: d?.usageType,
    };
  } catch (error) {
    logger.error(`AbuseIPDB checkIP error: ${error.message}`);
    return null;
  }
}

export default { checkIP };
