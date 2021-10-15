# react-oauth2-pkce

> Authenticate against generic OAuth2 using PKCE

[![NPM](https://img.shields.io/npm/v/react-oauth2-pkce.svg)](https://www.npmjs.com/package/react-oauth2-pkce) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-oauth2-pkce
```

## Usage

```tsx
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
```

### Custom Provider/Endpoint

After https://github.com/gardner/react-oauth2-pkce/pull/16 it is possible to pass in just `provider` or `authorizeEndpoint`, `tokenEndpoint` and `logoutEndpoint`. These two parameters were added to maintain backwards compatibility while enabling callers to customize the endpoint.

### End User Session on "Single Application Logout"
You can end user session when calling `logout(true)`. A custom endpoint can configured by passing `logoutEndpoint` as props. The user will be redirected to the `redirectUri`.

## License

MIT © [Gardner Bickford](https://github.com/gardner)
