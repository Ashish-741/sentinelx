/**
 * @fileoverview VirusTotal API service – URL, IP, and domain report lookups.
 * @see https://docs.virustotal.com/reference/overview
 */

import axios from 'axios';
import logger from '../utils/logger.js';

const VT_BASE = 'https://www.virustotal.com/api/v3';

/**
 * Get an axios client pre-configured with the VirusTotal API key.
 * Returns null if no API key is set.
 */
function getClient() {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    logger.debug('VirusTotal API key not configured – returning null');
    return null;
  }
  return axios.create({
    baseURL: VT_BASE,
    timeout: 15_000,
    headers: { 'x-apikey': apiKey },
  });
}

/**
 * Submit a URL for scanning.
 * @param {string} url
 * @returns {Promise<Object|null>}
 */
export async function scanURL(url) {
  const client = getClient();
  if (!client) return null;

  try {
    const { data } = await client.post('/urls', new URLSearchParams({ url }));
    return data;
  } catch (error) {
    logger.error(`VirusTotal scanURL error: ${error.message}`);
    return null;
  }
}

/**
 * Get a URL analysis report by ID.
 * @param {string} id - Base64-encoded URL identifier
 * @returns {Promise<Object|null>}
 */
export async function getURLReport(id) {
  const client = getClient();
  if (!client) return null;

  try {
    const { data } = await client.get(`/urls/${id}`);
    return data;
  } catch (error) {
    logger.error(`VirusTotal getURLReport error: ${error.message}`);
    return null;
  }
}

/**
 * Get an IP address report.
 * @param {string} ip
 * @returns {Promise<Object|null>}
 */
export async function getIPReport(ip) {
  const client = getClient();
  if (!client) return null;

  try {
    const { data } = await client.get(`/ip_addresses/${ip}`);
    return data;
  } catch (error) {
    logger.error(`VirusTotal getIPReport error: ${error.message}`);
    return null;
  }
}

/**
 * Get a domain report.
 * @param {string} domain
 * @returns {Promise<Object|null>}
 */
export async function getDomainReport(domain) {
  const client = getClient();
  if (!client) return null;

  try {
    const { data } = await client.get(`/domains/${domain}`);
    return data;
  } catch (error) {
    logger.error(`VirusTotal getDomainReport error: ${error.message}`);
    return null;
  }
}

export default { scanURL, getURLReport, getIPReport, getDomainReport };
