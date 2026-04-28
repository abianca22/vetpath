import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import {AuthProvider} from "./components/AuthenticationProvider.tsx";
import keycloak from "./api/keycloak.ts";
import 'bootstrap/dist/css/bootstrap.css';
import './custom.css';
import 'rsuite/dist/rsuite.css';

keycloak.init({ onLoad: "check-sso" }).then(() => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
            <AuthProvider keycloak={keycloak}>
                <App/>
            </AuthProvider>
        </React.StrictMode>
    );
});

