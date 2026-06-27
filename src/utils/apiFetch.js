import API_BASE from '../config/api'

function getToken() {
  try {
    const stored = localStorage.getItem('gymfit_auth')
    return stored ? JSON.parse(stored).token : null
  } catch {
    return null
  }
}

export function apiFetch(url, options = {}) {
  const token = getToken()
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  return fetch(`${API_BASE}${url}`, { ...options, headers })
}
