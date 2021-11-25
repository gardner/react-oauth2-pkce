/* eslint-disable @typescript-eslint/camelcase */
import { createPKCECodes, PKCECodePair } from './pkce'
import { toUrlEncoded } from './util'

import jwtDecode from 'jwt-decode'

export interface AuthServiceProp {
  clientId: string
  clientSecret?: string
  contentType?: string
  location: Location
  provider: string
  authorizeEndpoint?: string
  tokenEndpoint?: string
  logoutEndpoint?: string
  audience?: string
  redirectUri?: string
  scopes: string[]
  autoRefresh?: boolean
  refreshSlack?: number
  state?: string
}
export interface AuthServiceProps {
  [key: string]: AuthServiceProp
}

export interface AuthTokens {
  id_token: string
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number // calculated on login
  token_type: string
}

export interface JWTIDToken {
  given_name: string
  family_name: string
  name: string
  email: string
}

export interface TokenRequestBody {
  clientId: string
  grantType: string
  redirectUri?: string
  refresh_token?: string
  clientSecret?: string
  code?: string
  codeVerifier?: string
}

export class AuthService<TIDToken = JWTIDToken> {
  props: AuthServiceProps
  timeout?: number

  constructor(props: AuthServiceProps) {
    this.props = props
    const code = this.getValueFromLocation('code', window.location)
    const clientId = this.getValueFromLocation('state', window.location)
    if (code !== null && clientId !== null) {
      this.fetchToken(clientId, code)
        .then(() => {
          this.restoreUri()
        })
        .catch((e) => {
          this.removeItem('pkce')
          this.removeItem('auth')
          this.removeCodeFromLocation()
          this.removeStateFromLocation()
          console.warn({ e })
        })
    } else if (this.props.autoRefresh && clientId !== null) {
      this.startTimer(clientId)
    }
  }

  getUser(): {} {
    const t = this.getAuthTokens()
    if (null === t) return {}
    const decoded = jwtDecode(t.id_token) as TIDToken
    return decoded
  }

  getValueFromLocation(keyToSearch: string, location: Location): string | null {
    const split = location.toString().split('?')
    if (split.length < 2) {
      return null
    }
    const pairs = split[1].split('&')
    for (const pair of pairs) {
      const [key, value] = pair.split('=')
      if (key === keyToSearch) {
        return decodeURIComponent(value || '')
      }
    }
    return null
  }

  removeCodeFromLocation(): void {
    this.removeQueryParamFromLocation('code')
  }

  removeStateFromLocation(): void {
    this.removeQueryParamFromLocation('state')
  }

  removeQueryParamFromLocation(keyToRemove: string): void {
    const [base, search] = window.location.href.split('?')
    if (!search) {
      return
    }
    const newSearch = search
      .split('&')
      .map((param) => param.split('='))
      .filter(([key]) => key !== keyToRemove)
      .map((keyAndVal) => keyAndVal.join('='))
      .join('&')
    window.history.replaceState(
      window.history.state,
      'null',
      base + (newSearch.length ? `?${newSearch}` : '')
    )
  }

  getItem(key: string): string | null {
    return window.localStorage.getItem(key)
  }
  removeItem(key: string): void {
    window.localStorage.removeItem(key)
  }

  getPkce(): PKCECodePair {
    const pkce = window.localStorage.getItem('pkce')
    if (null === pkce) {
      throw new Error('PKCE pair not found in local storage')
    } else {
      return JSON.parse(pkce)
    }
  }

  setAuthTokens(clientId: string, auth: AuthTokens): void {
    const { refreshSlack = 5 } = this.props[clientId]
    const now = new Date().getTime()
    auth.expires_at = now + (auth.expires_in + refreshSlack) * 1000
    window.localStorage.setItem('auth', JSON.stringify(auth))
  }

  getAuthTokens(): AuthTokens {
    return JSON.parse(window.localStorage.getItem('auth') || '{}')
  }

  isPending(): boolean {
    return (
      window.localStorage.getItem('pkce') !== null &&
      window.localStorage.getItem('auth') === null
    )
  }

  isAuthenticated(): boolean {
    return window.localStorage.getItem('auth') !== null
  }

  async logout(clientId?: string, shouldEndSession = false): Promise<boolean> {
    this.removeItem('pkce')
    this.removeItem('auth')
    if (shouldEndSession && clientId) {
      const { provider, logoutEndpoint, redirectUri } = this.props[clientId]
      const query = {
        client_id: clientId,
        post_logout_redirect_uri: redirectUri
      }
      const url = `${logoutEndpoint || `${provider}/logout`}?${toUrlEncoded(
        query
      )}`
      window.location.replace(url)
      return true
    } else {
      window.location.reload()
      return true
    }
  }

  async login(clientId: string): Promise<void> {
    this.authorize(clientId)
  }

  // this will do a full page reload and to to the OAuth2 provider's login page and then redirect back to redirectUri
  authorize(clientId: string): boolean {
    const {
      provider,
      authorizeEndpoint,
      redirectUri,
      scopes,
      audience,
      state
    } = this.props[clientId]

    const pkce = createPKCECodes()
    window.localStorage.setItem('pkce', JSON.stringify(pkce))
    window.localStorage.setItem('preAuthUri', location.href)
    window.localStorage.removeItem('auth')
    const codeChallenge = pkce.codeChallenge

    const query = {
      clientId,
      scope: scopes.join(' '),
      responseType: 'code',
      redirectUri,
      ...(audience && { audience }),
      codeChallenge,
      codeChallengeMethod: 'S256',
      state: state
    }
    // Responds with a 302 redirect
    const url = `${authorizeEndpoint || `${provider}/authorize`}?${toUrlEncoded(
      query
    )}`
    window.location.replace(url)
    return true
  }

  // this happens after a full page reload. Read the code from localstorage
  async fetchToken(
    clientId: string,
    code: string,
    isRefresh = false
  ): Promise<AuthTokens> {
    const {
      clientSecret,
      contentType,
      provider,
      tokenEndpoint,
      redirectUri,
      autoRefresh = true
    } = this.props[clientId]
    const grantType = 'authorization_code'

    let payload: TokenRequestBody = {
      clientId,
      ...(clientSecret ? { clientSecret } : {}),
      redirectUri,
      grantType
    }
    if (isRefresh) {
      payload = {
        ...payload,
        grantType: 'refresh_token',
        refresh_token: code
      }
    } else {
      const pkce: PKCECodePair = this.getPkce()
      const codeVerifier = pkce.codeVerifier
      payload = {
        ...payload,
        code,
        codeVerifier
      }
    }

    const response = await fetch(`${tokenEndpoint || `${provider}/token`}`, {
      headers: {
        'Content-Type': contentType || 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: toUrlEncoded(payload)
    })
    this.removeItem('pkce')
    const json = await response.json()
    if (isRefresh && !json.refresh_token) {
      json.refresh_token = payload.refresh_token
    }
    this.setAuthTokens(clientId, json as AuthTokens)
    if (autoRefresh) {
      this.startTimer(clientId)
    }
    return this.getAuthTokens()
  }

  armRefreshTimer(
    clientId: string,
    refreshToken: string,
    timeoutDuration: number
  ): void {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    this.timeout = window.setTimeout(() => {
      this.fetchToken(clientId, refreshToken, true)
        .then(({ refresh_token: newRefreshToken, expires_at: expiresAt }) => {
          if (!expiresAt) return
          const now = new Date().getTime()
          const timeout = expiresAt - now
          if (timeout > 0) {
            this.armRefreshTimer(clientId, newRefreshToken, timeout)
          } else {
            this.removeItem('auth')
            this.removeCodeFromLocation()
            this.removeStateFromLocation()
          }
        })
        .catch((e) => {
          this.removeItem('auth')
          this.removeCodeFromLocation()
          this.removeStateFromLocation()
          console.warn({ e })
        })
    }, timeoutDuration)
  }

  startTimer(clientId: string): void {
    const authTokens = this.getAuthTokens()
    if (!authTokens) {
      return
    }
    const { refresh_token: refreshToken, expires_at: expiresAt } = authTokens
    if (!expiresAt || !refreshToken) {
      return
    }
    const now = new Date().getTime()
    const timeout = expiresAt - now
    if (timeout > 0) {
      this.armRefreshTimer(clientId, refreshToken, timeout)
    } else {
      this.removeItem('auth')
      this.removeCodeFromLocation()
    }
  }

  restoreUri(): void {
    const uri = window.localStorage.getItem('preAuthUri')
    window.localStorage.removeItem('preAuthUri')
    console.log({ uri })
    if (uri !== null) {
      window.location.replace(uri)
    }
    this.removeCodeFromLocation()
  }
}
