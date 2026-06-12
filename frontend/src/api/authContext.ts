import {createContext, type Dispatch, type SetStateAction} from "react";
import type {NotificationDTO, UserDTO} from "../types.ts";

interface AuthenticationContext {
    user: UserDTO | null;
    setUser: Dispatch<SetStateAction<UserDTO | null>>;
    token: string | null;
    logout: () => void;
    login: () => void;
    loading: boolean;
    notifications: NotificationDTO[];
    setNotifications: Dispatch<SetStateAction<NotificationDTO[] | []>>
}

export const AuthContext = createContext<AuthenticationContext | null>(null);
