/**
 * @fileoverview GeoIP lookup service – resolves IP addresses to geographic data.
 * Uses the free ip-api.com service (no key required, 45 req/min limit).
 */

import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * Look up geographic and network information for an IP address.
 * @param {string} ip - IPv4 or IPv6 address
 * @returns {Promise<Object>} Geo information (real or mock fallback)
 */
export async function lookup(ip) {
  try {
    const { data } = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 8_000,
      params: {
        fields:
          'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,query',
      },
    });

    if (data.status === 'fail') {
      logger.warn(`GeoIP lookup failed for ${ip}: ${data.message}`);
      return getMockGeoData(ip);
    }

    return {
      ip: data.query,
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      zip: data.zip,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      asn: data.as,
      asName: data.asname,
    };
  } catch (error) {
    logger.warn(`GeoIP lookup error for ${ip}: ${error.message}. Using mock data.`);
    return getMockGeoData(ip);
  }
}

/**
 * Return realistic mock GeoIP data for demo / fallback purposes.
 * @param {string} ip
 * @returns {Object}
 */
function getMockGeoData(ip) {
  return {
    ip,
    country: 'United States',
    countryCode: 'US',
    region: 'California',
    city: 'San Francisco',
    zip: '94102',
    lat: 37.7749,
    lon: -122.4194,
    timezone: 'America/Los_Angeles',
    isp: 'Demo ISP Inc.',
    org: 'Demo Organization',
    asn: 'AS15169 Demo ASN',
    asName: 'DEMO-NET',
    _demo: true,
  };
}

export default { lookup };
