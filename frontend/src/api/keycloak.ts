import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: "http://localhost:8080",
    realm: "vet",
    clientId: "vetpath",
});

export default keycloak;