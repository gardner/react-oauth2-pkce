export type PKCECodePair = {
  codeVerifier: string
  codeChallenge: string
  createdAt: Date
}

const generateRandomString = (length: number): string => {
  let text = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

export const createPKCECodes = async (): Promise<PKCECodePair> => {
  const codeVerifier = generateRandomString(64)
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier)
  )

  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  const createdAt = new Date()

  const codePair = {
    codeVerifier,
    codeChallenge,
    createdAt
  }
  return codePair
}
