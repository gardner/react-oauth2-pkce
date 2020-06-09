import { ReactElement, ReactNode } from 'react';
import { AuthService } from './AuthService';
interface AuthProviderProps {
    children: ReactNode;
    authService: AuthService;
}
export declare const AuthProvider: (props: AuthProviderProps) => ReactElement;
export {};
