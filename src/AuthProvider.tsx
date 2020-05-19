import React, { ReactElement, ReactNode, useEffect, useState } from 'react'

import { AuthService, AuthTokens } from './AuthService'
import { AuthContext } from './AuthContext'

interface AuthProviderProps {
  children: ReactNode
  authService: AuthService
  authTokens?: AuthTokens
}

export const AuthProvider = (props: AuthProviderProps): ReactElement => {
  const { authService, children } = props
  const [authTokens, setAuthTokens] = useState(authService.getAuthTokens())

  useEffect(() => {
    const code = authService.getCodeFromLocation(location)
    console.log('useEffect', location.href)
    if (code !== null) {
      authService
        .fetchToken(code)
        .then((tokens) => {
          console.log({ tokens })
          setAuthTokens(tokens)
        })
        .catch((e) => {
          console.warn({ e })
        })
    }
  }, [location, authService])

  return (
    <AuthContext.Provider value={{ authTokens, authService }}>
      {children}
    </AuthContext.Provider>
  )
}
