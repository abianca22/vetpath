import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import './output.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'rsuite/dist/rsuite.css';
import './custom.css';
import {AuthProvider} from "./components/AuthenticationProvider.tsx";
import keycloak from "./api/keycloak.ts";
import {BrowserRouter} from "react-router-dom";

keycloak.init({ onLoad: "check-sso", pkceMethod: 'S256', responseMode: "query", checkLoginIframe: false }).then(() => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
            <BrowserRouter>
            <AuthProvider keycloak={keycloak}>
                <App/>
            </AuthProvider>
            </BrowserRouter>
        </React.StrictMode>
    );
});


