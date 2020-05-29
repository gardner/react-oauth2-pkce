import React, { useContext, ReactElement } from 'react'

import { AuthServiceProps, AuthService } from './AuthService'

export type AuthContextProps = {
  authService: AuthService
}

export type AuthContextType = AuthContextProps | undefined

export const AuthContext = React.createContext<AuthContextProps | undefined>(
  undefined
)

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider')
  }
  return context
}

export function withAuth<T>(
  ComponentToWrap: React.ComponentType<T & AuthServiceProps>
): React.FC<T & AuthServiceProps> {
  const WrappedComponent = (props: T & AuthServiceProps): ReactElement => {
    const authProps = useAuth()
    return <ComponentToWrap {...authProps} {...props} />
  }
  WrappedComponent.displayName =
    'withAuth_' + (ComponentToWrap.displayName || ComponentToWrap.name)
  return WrappedComponent
}
