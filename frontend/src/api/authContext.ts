import {createContext, type Dispatch, type SetStateAction} from "react";
import type {UserDTO} from "../types.ts";

interface AuthenticationContext {
    user: UserDTO | null;
    setUser: Dispatch<SetStateAction<UserDTO | null>>;
    token: string | null;
    logout: () => void;
    login: () => void;
    loading: boolean;
}

export const AuthContext = createContext<AuthenticationContext | null>(null);
