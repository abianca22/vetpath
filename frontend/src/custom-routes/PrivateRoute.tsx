import {Navigate} from "react-router-dom";
import {useContext} from "react";
import {AuthContext} from "../api/authContext.ts";
import type {RoleDTO} from "../types.ts";

export default function PrivateRoute({element: Component, roles, ...rest}) {
    const auth = useContext(AuthContext);
    if (auth.loading) {
        return <div>Loading...</div>;
    }
    if (!auth.user) {
        return <Navigate to="/login"></Navigate>;
    }
    if (!roles.some((role: RoleDTO) => {
        const currentRole = auth.user.roles.find((userRole: RoleDTO) => userRole.name === role.name);
        return currentRole !== null && currentRole !== undefined;
    })) {
        return <Navigate to="/access-denied"></Navigate>;
    }

    return <Component {...rest} />
}