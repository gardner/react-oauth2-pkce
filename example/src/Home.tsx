import React from 'react'
import { useAuth } from 'react-oauth2-pkce'

export const Home = () => {
  const { authService, authTokens } = useAuth()

  const login = async () => {
    authService.authorize()
  }
  const logout = async () => {
    authService.logout()
  }

  if (authService.isPending()) {
    return <div>Loading...</div>
  }

  if (!authService.isAuthenticated()) {
    return (
      <div>
        <p>Not Logged in yet: {authTokens.id_token} </p>
        <button onClick={login}>Login</button>
      </div>
    )
  }

  return (
    <div>
      <p>Logged in! {authTokens.id_token}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

export default Home
