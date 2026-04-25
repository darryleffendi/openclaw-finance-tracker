export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options)
  if (res.status === 401) {
    window.location.href = '/api/auth/login'
    return new Promise(() => {})
  }
  return res
}
