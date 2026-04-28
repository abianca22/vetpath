import {type ReactNode, useEffect, useState} from "react";
import type {UserDTO} from "../types.ts";
import {getUserInfo} from "../api/api.ts";
import {AuthContext} from "../api/authContext.ts";
import type Keycloak from "keycloak-js";

export const AuthProvider = ({ children, keycloak }: { children: ReactNode, keycloak: Keycloak }) => {
    const [user, setUser] = useState<UserDTO|null>(null);
    const [token, setToken] = useState<string|null>(keycloak.token);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!keycloak.token) {
            setLoading(false);
            return;
        }
        const fetchUser = async () => {
            try {
                const data = await getUserInfo(keycloak.token);
                setUser(data);
                setToken(keycloak.token);
            } catch (err) {
                console.log(keycloak.token);
                console.error("Backend error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();

    }, [keycloak.token]);

    const logout = () => {
        keycloak.logout({
            redirectUri: window.location.origin
        });
    };

    const login = () => {
        keycloak.login();
    }

    return (
        <AuthContext.Provider value={{ user, setUser, token, logout, login, loading }}>
            {children}
        </AuthContext.Provider>
    );
}