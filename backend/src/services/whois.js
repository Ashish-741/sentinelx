/**
 * @fileoverview WHOIS lookup service – queries domain registration data.
 * Uses a free HTTP-based WHOIS API; falls back to mock data when unavailable.
 */

import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * Look up WHOIS data for a domain.
 * @param {string} domain - Fully-qualified domain name
 * @returns {Promise<Object>} WHOIS information (real or mock)
 */
export async function lookupDomain(domain) {
  try {
    // Free WHOIS API – no key required
    const { data } = await axios.get(`https://rdap.org/domain/${domain}`, {
      timeout: 10_000,
      headers: { Accept: 'application/rdap+json' },
    });

    // Parse RDAP response into a simplified object
    const registrar =
      data?.entities?.find((e) => e?.roles?.includes('registrar'))?.vcardArray?.[1]
        ?.find((v) => v[0] === 'fn')?.[3] || 'Unknown';

    const events = data?.events || [];
    const registration = events.find((e) => e.eventAction === 'registration')?.eventDate;
    const expiration = events.find((e) => e.eventAction === 'expiration')?.eventDate;
    const lastChanged = events.find((e) => e.eventAction === 'last changed')?.eventDate;

    const nameservers = (data?.nameservers || []).map((ns) => ns.ldhName).filter(Boolean);

    return {
      domainName: data?.ldhName || domain,
      registrar,
      creationDate: registration || null,
      expiryDate: expiration || null,
      lastUpdated: lastChanged || null,
      nameservers,
      status: data?.status || [],
      dnssec: data?.secureDNS?.delegationSigned || false,
    };
  } catch (error) {
    logger.warn(`WHOIS lookup failed for ${domain}: ${error.message}. Using mock data.`);
    return getMockWhoisData(domain);
  }
}

/**
 * Return realistic mock WHOIS data for demo / fallback purposes.
 * @param {string} domain
 * @returns {Object}
 */
function getMockWhoisData(domain) {
  return {
    domainName: domain,
    registrar: 'Demo Registrar Inc.',
    creationDate: '2019-03-15T00:00:00Z',
    expiryDate: '2027-03-15T00:00:00Z',
    lastUpdated: '2024-12-01T00:00:00Z',
    nameservers: ['ns1.example.com', 'ns2.example.com'],
    status: ['clientTransferProhibited'],
    dnssec: false,
    _demo: true,
  };
}

export default { lookupDomain };
