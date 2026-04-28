import {Navigate} from "react-router-dom";
import {useContext} from "react";
import {AuthContext} from "../api/authContext.ts";

export default function NotAuthenticatedRoute({element: Component, ...rest}) {
    const auth = useContext(AuthContext);
    if (!auth.user || !auth.token) {
        return <Component {...rest} />;
    }
    else return <Navigate to={"/profile"} replace={true}/>;
}