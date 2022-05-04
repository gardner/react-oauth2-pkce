import { AuthService, AuthServiceProps } from './AuthService'

const props: AuthServiceProps = {
  clientId: 'testClientID',
  clientSecret: undefined,
  location,
  contentType: undefined,
  provider: 'http://oauth2provider/',
  redirectUri: 'http://localhost/',
  scopes: ['openid', 'profile']
}

const nodeCrypto = require('crypto')
const authService = new AuthService(props)

// example data for a token from https://jwt.io
const fakeData =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

const fakeToken = {
  id_token: 'id_token',
  access_token: 'access_token',
  refresh_token: 'refresh_token',
  expires_in: 3600,
  token_type: 'Bearer'
}

let originalFetch: any = null

// mock for fetsch (see: https://jaketrent.com/post/mock-fetch-jest-test)
function setupFetchStub(data: any) {
  return function fetchStub(_url: any) {
    return new Promise((resolve) => {
      resolve({
        json: () =>
          Promise.resolve({
            data
          })
      })
    })
  }
}

beforeAll(() => {
  originalFetch = window.fetch
  ;(window as any).fetch = jest.fn(() => {
    json: () => Promise.resolve(fakeToken)
  })

  // mock window.crypto functions by using node.js crypto library
  ;(window as any).crypto = {
    getRandomValues: function (buffer: any) {
      return nodeCrypto.randomFillSync(buffer)
    },
    subtle: {
      digest: function (alg: string, data: Uint8Array) {
        const buffer = Buffer.from(data)
        const hash: Buffer = nodeCrypto
          .createHash('sha256')
          .update(buffer)
          .digest()

        const result = new Promise<ArrayBuffer>(() =>
          Buffer.from(new Uint8Array(hash))
        )
        return result
      }
    }
  }
})

afterAll(() => {
  global.fetch = originalFetch
})

describe('AuthService', () => {
  it('is truthy', () => {
    expect(AuthService).toBeTruthy()
  })

  it('should add requestId to headers', async () => {
    const authorizationCode = 'authorizationCode'

    await authService.login()

    const tokens = await authService.fetchToken(authorizationCode)
    console.log(tokens)
    expect(tokens).not.toBeUndefined()
    expect(tokens).not.toBeNull()
    // expect(fakeFetch.mock.calls[0][1]).toHaveProperty('headers')
    // expect(fakeFetch.mock.calls[0][1].headers).toHaveProperty('requestId')
  })

  // it('it parses a token', () => {
  //   window.localStorage.setItem('auth', tokens)
  //   authService.getUser()
  // })
})
