import React, { ReactElement, ReactNode } from 'react'

import { AuthService } from './AuthService'
import { AuthContext } from './AuthContext'

interface AuthProviderProps {
  children: ReactNode
  authService: AuthService
}

export const AuthProvider = (props: AuthProviderProps): ReactElement => {
  const { authService, children } = props

  return (
    <AuthContext.Provider value={{ authService }}>
      {children}
    </AuthContext.Provider>
  )
}
