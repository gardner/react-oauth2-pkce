import React from 'react'
import { AuthProvider, AuthService } from 'react-oauth2-pkce'

import { Routes } from './Routes';

const authService = new AuthService({
clientId: process.env.REACT_APP_CLIENT_ID || 'CHANGEME',
location: window.location,
provider: process.env.REACT_APP_PROVIDER || 'https://sandbox.auth.ap-southeast-2.amazoncognito.com/oauth2',
redirectUri: process.env.REACT_APP_REDIRECT_URI || window.location.origin,
scopes: ['openid', 'profile']
});

const App = () => {
  return (
    <AuthProvider authService={authService} >
      <Routes />
    </AuthProvider>
  )
}

export default App
