import { createPKCECodes, PKCECodePair } from './pkce'
import { toUrlEncoded } from './util'

export interface AuthServiceProps {
  clientId: string
  clientSecret?: string
  contentType?: string
  location: Location
  provider: string
  redirectUri?: string
  scopes: string[]
}

export interface AuthTokens {
  idToken: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

export class AuthService {
  props: AuthServiceProps

  constructor(props: AuthServiceProps) {
    this.props = props
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

  logout(): void {
    const { location } = this.props
    this.removeItem('pkce')
    this.removeItem('auth')
    location.reload()
  }

  // this will do a full page reload and to to the OAuth2 provider's login page and then redirect back to redirectUri
  authorize(): void {
    const { clientId, location, provider, redirectUri, scopes } = this.props

    const pkce = createPKCECodes()
    window.localStorage.setItem('pkce', JSON.stringify(pkce))
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
    location.replace(url)
  }

  // this happens after a full page reload. Read the code from localstorage
  async fetchToken(code: string): Promise<AuthTokens> {
    const {
      clientId,
      clientSecret,
      contentType,
      provider,
      redirectUri
    } = this.props
    const grantType = 'authorization_code'
    const pkce: PKCECodePair = this.getPkce()
    const codeVerifier = pkce.codeVerifier
    this.removeCodeFromLocation()

    const payload = {
      clientId,
      ...(clientSecret ? { clientSecret } : {}),
      code,
      redirectUri,
      grantType,
      codeVerifier
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
    this.setAuthTokens(json as AuthTokens)
    return json
  }
}
