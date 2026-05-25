/**
 * @fileoverview ML Service client – communicates with the Python ML microservice.
 */

import axios from 'axios';
import logger from '../utils/logger.js';

const ML_BASE_URL = () => process.env.ML_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = 10_000;

/**
 * Create an axios instance configured for the ML service.
 */
function getClient() {
  return axios.create({
    baseURL: ML_BASE_URL(),
    timeout: TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Send a URL to the ML service for phishing prediction.
 * @param {string} url - The URL to analyse
 * @returns {Promise<Object|null>} Prediction result or null on failure
 */
export async function predictURL(url) {
  try {
    const client = getClient();
    const { data } = await client.post('/api/ml/predict-url', { url });
    logger.debug(`ML predictURL response for ${url}`);
    return data;
  } catch (error) {
    logger.warn(`ML service unavailable (predictURL): ${error.message}`);
    return null;
  }
}

/**
 * Send email text to the ML service for phishing analysis.
 * @param {string} text - The raw email body
 * @returns {Promise<Object|null>} Analysis result or null on failure
 */
export async function analyzeEmail(text) {
  try {
    const client = getClient();
    const { data } = await client.post('/api/ml/analyze-email', {
      email_text: text,
      text,
    });
    logger.debug('ML analyzeEmail response received');
    return data;
  } catch (error) {
    logger.warn(`ML service unavailable (analyzeEmail): ${error.message}`);
    return null;
  }
}

/**
 * Check if the ML service is healthy.
 * @returns {Promise<boolean>}
 */
export async function healthCheck() {
  try {
    const client = getClient();
    const { data } = await client.get('/api/ml/health');
    return data?.status === 'ok' || data?.status === 'healthy';
  } catch {
    return false;
  }
}

export default { predictURL, analyzeEmail, healthCheck };
