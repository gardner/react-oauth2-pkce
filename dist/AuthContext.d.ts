import React from 'react';
import { AuthServiceProps, AuthService } from './AuthService';
export declare type AuthContextProps = {
    authService: AuthService;
};
export declare type AuthContextType = AuthContextProps | undefined;
export declare const AuthContext: React.Context<AuthContextProps | undefined>;
export declare const useAuth: () => AuthContextProps;
export declare function withAuth<T>(ComponentToWrap: React.ComponentType<T & AuthServiceProps>): React.FC<T & AuthServiceProps>;
