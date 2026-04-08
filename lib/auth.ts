export const getToken = () => localStorage.getItem('token')
export const getName = () => localStorage.getItem('name')
export const getEmail = () => localStorage.getItem('email')

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

export const isLoggedIn = () => !!getToken()