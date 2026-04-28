import {useContext} from "react";
import {AuthContext} from "../api/authContext.ts";
import {Button, Col, Container, Row} from "react-bootstrap";

export default function Login() {
    const auth = useContext(AuthContext);

    const handleLogin = () => auth?.login();

    return (
        <Container className="justify-content-center d-flex flex-grow-1" fluid>
            <Row className="text-center align-items-center">
                <Col>
                    <h1 className="fw-bold p-2">Welcome!</h1>
                    <p className="p-2">You are not logged in. Please log in to see your profile information.</p>
                    <Button onClick={handleLogin} variant="primary" className="custom-button btn-md">
                        Login
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}
