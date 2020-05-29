import { randomBytes, createHash } from 'crypto'

export type PKCECodePair = {
  codeVerifier: string
  codeChallenge: string
  createdAt: Date
}

export const base64URLEncode = (str: Buffer): string => {
  return str
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export const sha256 = (buffer: Buffer): Buffer => {
  return createHash('sha256').update(buffer).digest()
}

export const createPKCECodes = (): PKCECodePair => {
  const codeVerifier = base64URLEncode(randomBytes(64))
  const codeChallenge = base64URLEncode(sha256(Buffer.from(codeVerifier)))
  const createdAt = new Date()
  const codePair = {
    codeVerifier,
    codeChallenge,
    createdAt
  }
  return codePair
}
