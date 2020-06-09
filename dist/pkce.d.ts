/// <reference types="node" />
export declare type PKCECodePair = {
    codeVerifier: string;
    codeChallenge: string;
    createdAt: Date;
};
export declare const base64URLEncode: (str: Buffer) => string;
export declare const sha256: (buffer: Buffer) => Buffer;
export declare const createPKCECodes: () => PKCECodePair;
