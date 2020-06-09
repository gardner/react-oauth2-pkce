import { PKCECodePair } from './pkce';
export interface AuthServiceProps {
    clientId: string;
    clientSecret?: string;
    contentType?: string;
    location: Location;
    provider: string;
    redirectUri?: string;
    scopes: string[];
    autoRefresh?: boolean;
    refreshSlack?: number;
}
export interface AuthTokens {
    id_token: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}
export interface JWTIDToken {
    given_name: string;
    family_name: string;
    name: string;
    email: string;
}
export interface TokenRequestBody {
    clientId: string;
    grantType: string;
    redirectUri?: string;
    refresh_token?: string;
    clientSecret?: string;
    code?: string;
    codeVerifier?: string;
}
export declare class AuthService<TIDToken = JWTIDToken> {
    props: AuthServiceProps;
    constructor(props: AuthServiceProps);
    getUser(): {};
    getCodeFromLocation(location: Location): string | null;
    removeCodeFromLocation(): void;
    getItem(key: string): string | null;
    removeItem(key: string): void;
    getPkce(): PKCECodePair;
    setAuthTokens(auth: AuthTokens): void;
    getAuthTokens(): AuthTokens;
    isPending(): boolean;
    isAuthenticated(): boolean;
    logout(): Promise<boolean>;
    login(): Promise<void>;
    authorize(): boolean;
    fetchToken(code: string, isRefresh?: boolean): Promise<AuthTokens>;
    armRefreshTimer(refreshToken: string, timeoutDuration: number): void;
    startTimer(): void;
    restoreUri(): void;
}
