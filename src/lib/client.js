/**
 * Managed fetch utility for API calls (replaces axios, etc.)
 * Handles JSON, errors, and custom options.
 *
 * @param {string} url - The API endpoint
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} - Resolves with response data or throws error
 */
export async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const contentType = res.headers.get('content-type');
    console.log(contentType, 'Content-Type of response');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    if (!res.ok) {
      throw new Error(data?.error || data || 'API Error');
    }
    return data;
  } catch (err) {
    throw err;
  }
}
