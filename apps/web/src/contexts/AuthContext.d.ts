import { type ReactNode } from 'react';
interface User {
    id: string;
    email: string;
    name: string | null;
}
interface AuthContextValue {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isReady: boolean;
}
export declare function AuthProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextValue;
export {};
