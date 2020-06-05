import { createPKCECodes, PKCECodePair } from './pkce'
import { toUrlEncoded } from './util'

import jwtDecode from 'jwt-decode'

export interface AuthServiceProps {
  clientId: string
  clientSecret?: string
  contentType?: string
  location: Location
  provider: string
  redirectUri?: string
  scopes: string[]
  expireSlack?: number
}

export interface AuthTokens {
  id_token: string
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export interface JWTIDToken {
  given_name: string
  family_name: string
  name: string
  email: string
}

export class AuthService<TIDToken = JWTIDToken> {
  props: AuthServiceProps

  constructor(props: AuthServiceProps) {
    this.props = props
    const code = this.getCodeFromLocation(window.location)
    if (code !== null) {
      this.fetchToken(code)
        .then(() => {
          this.restoreUri()
        })
        .catch((e) => {
          this.removeItem('pkce')
          this.removeItem('auth')
          this.removeCodeFromLocation()
          console.warn({ e })
        })
    }
  }

  getUser(): {} {
    const t = this.getAuthTokens()
    if (null === t) return {}
    const decoded = jwtDecode(t.id_token) as TIDToken
    return decoded
  }

  getCodeFromLocation(location: Location): string | null {
    const split = location.toString().split('?')
    if (split.length < 2) {
      return null
    }
    const pairs = split[1].split('&')
    for (const pair of pairs) {
      const [key, value] = pair.split('=')
      if (key === 'code') {
        return decodeURIComponent(value || '')
      }
    }
    return null
  }

  removeCodeFromLocation(): void {
    const [base, search] = window.location.href.split('?')
    if (!search) {
      return
    }
    const newSearch = search
      .split('&')
      .map((param) => param.split('='))
      .filter(([key]) => key !== 'code')
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
  setAuthTokens(auth: AuthTokens): void {
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

  async logout(): Promise<boolean> {
    this.removeItem('pkce')
    this.removeItem('auth')
    window.location.reload()
    return true
  }

  async login(): Promise<void> {
    this.authorize()
  }

  // this will do a full page reload and to to the OAuth2 provider's login page and then redirect back to redirectUri
  authorize(): boolean {
    const { clientId, provider, redirectUri, scopes } = this.props

    const pkce = createPKCECodes()
    window.localStorage.setItem('pkce', JSON.stringify(pkce))
    window.localStorage.setItem('preAuthUri', location.href)
    window.localStorage.removeItem('auth')
    const codeChallenge = pkce.codeChallenge

    const query = {
      clientId,
      scopes: scopes.join(' '),
      responseType: 'code',
      redirectUri,
      codeChallenge,
      codeChallengeMethod: 'S256'
    }
    // Responds with a 302 redirect
    const url = `${provider}/authorize?${toUrlEncoded(query)}`
    window.location.replace(url)
    return true
  }

  // this happens after a full page reload. Read the code from localstorage
  async fetchToken(code: string, refreshToken?: string): Promise<AuthTokens> {
    const {
      clientId,
      clientSecret,
      contentType,
      provider,
      redirectUri
    } = this.props
    const grantType = refreshToken ? 'refresh_token' : 'authorization_code'
    const pkce: PKCECodePair = this.getPkce()
    const codeVerifier = pkce.codeVerifier

    const payload = {
      clientId,
      ...(clientSecret ? { clientSecret } : {}),
      code,
      redirectUri,
      grantType,
      codeVerifier,
      ...(refreshToken ? { refreshToken } : {})
    }

    const response = await fetch(`${provider}/token`, {
      headers: {
        'Content-Type': contentType || 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: toUrlEncoded(payload)
    })
    this.removeItem('pkce')
    const json = await response.json()
    this.setRefreshTimer(json.refresh_token, json.expires_in)
    this.setAuthTokens(json as AuthTokens)
    return json
  }

  setRefreshTimer(refreshToken: string, expiresIn: number): void {
    if (!refreshToken || !expiresIn) {
      return
    }
    const { expireSlack = 1000 } = this.props

    setTimeout(() => {
      const code = this.getCodeFromLocation(window.location)
      if (code !== null) {
        this.fetchToken(code, refreshToken)
          .then(() => {
            this.restoreUri()
          })
          .catch((e) => {
            this.removeItem('pkce')
            this.removeItem('auth')
            this.removeCodeFromLocation()
            console.warn({ e })
          })
      }
    }, expiresIn * 1000 - expireSlack)
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
