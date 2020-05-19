import { AuthService, AuthTokens, AuthServiceProps } from './AuthService'

const props: AuthServiceProps = {
  clientId: 'testClientID',
  clientSecret: undefined,
  location,
  contentType: undefined,
  provider: 'http://oauth2provider/',
  redirectUri: 'http://localhost/',
  scopes: ['openid', 'profile']
}

const stubTokens: AuthTokens = {
  accessToken: 'accessToken',
  idToken: 'idToken',
  refreshToken: 'refreshToken',
  expiresIn: 3600,
  tokenType: 'Bearer'
}

// const stubToken =
//   '{"id_token":"id_token","access_token":"access_token","refresh_token":"refresh_token","expires_in":3600,"token_type":"Bearer"}'

const authService = new AuthService(props)

describe('AuthService', () => {
  it('is truthy', () => {
    expect(AuthService).toBeTruthy()
  })

  it('should add requestId to headers', () => {
    const fakeFetch = jest.fn()
    window.fetch = fakeFetch
    const authorizationCode = 'authorizationCode'
    authService.fetchToken(authorizationCode).then((tokens) => {
      console.log(tokens)
      expect(fakeFetch.mock.calls[0][1]).toHaveProperty('headers')
      expect(fakeFetch.mock.calls[0][1].headers).toHaveProperty('requestId')
    })
  })

  // it('it retrives a token', () => {
  //   const mockJsonPromise = Promise.resolve(JSON.stringify(stubTokens))
  //   const mockFetchPromise = Promise.resolve({
  //     json: () => mockJsonPromise
  //   })
  //   jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise)
  //   const fetchSpy: SpyInstance = jest.spyOn(global.prototype, 'fetch')

  //   const authorizationCode = 'authorizationCode'
  //   authService.fetchToken(authorizationCode).then((tokens) => {
  //     expect(tokens.accessToken).toContainEqual(stubTokens.accessToken)
  //     expect(fetchSpy).toHaveBeenCalled()
  //   })
  // })
})
