export const getToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export const getName = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('name')
}

export const getEmail = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('email')
}

export const saveAuth = (token: string, name: string, email: string) => {
  localStorage.setItem('token', token)
  localStorage.setItem('name', name)
  localStorage.setItem('email', email)
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('name')
  localStorage.removeItem('email')
}

export const isLoggedIn = () => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('token')
}