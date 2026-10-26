import { authHeaders } from '../lib/apiClient';

/**
 * Returns headers object suitable for axios `headers` option.
 * Prefers an explicit token; falls back to localStorage via authHeaders.
 */
const authHeader = (token) => authHeaders(token);

export default authHeader;
