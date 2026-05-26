import {Container, Nav, Navbar} from "react-bootstrap";
import {isAdmin, isPetOwner, isVeterinarian} from "../api/roles.ts";

export default function Menu({auth}) {
    return (
        <Navbar sticky="top" data-bs-theme="dark" className="w-100 vet-bg px-lg-3">
            <Container fluid>
                <Navbar.Brand href="/">VETPATH</Navbar.Brand>
                <Nav className="me-auto">
                    { auth.user ? (
                        <>
                            <Nav.Link href="/profile" className={window.location.href.includes("/profile") ? "selected" : ""}>Profil</Nav.Link>
                            <Nav.Link href="/users" className={window.location.href.includes("/users") ? "selected" : ""}>Utilizatori</Nav.Link>
                            <Nav.Link href={`/pets${isPetOwner(auth.user.roles) ? `/${auth.user.username}` : ''}`} className={window.location.href.includes(`/pets`) ? "selected" : ""}>Animale</Nav.Link>
                            <Nav.Link href="/clinics" className={window.location.href.includes("/clinics") ? "selected" : ""}>Clinici</Nav.Link>
                            {isAdmin(auth.user.roles) && <><Nav.Link href="/pets/types" className={(window.location.href.includes("/pets/types") && !window.location.href.includes("/pets/types/")) ? "selected" : ""}>Specii</Nav.Link>
                                <Nav.Link href="/pets/breeds" className={(window.location.href.includes("/pets/breeds") || window.location.href.includes("/breeds")) ? "selected" : ""}>Rase</Nav.Link></>}
                            {isVeterinarian(auth.user.roles) && <Nav.Link href="/slots" className={window.location.href.includes('/slots') ? "selected" : ""}>Program</Nav.Link>}
                            <Nav.Link href="/appointments" className={window.location.href.includes('appointments') ? "selected" : ""}>Programari</Nav.Link>
                            <Nav.Link href="/records" className={window.location.href.includes('records') ? "selected" : ""}>Rapoarte</Nav.Link>
                            <Nav.Link href="/ask" className={window.location.href.includes('ask') ? "selected" : ""}>Intrebari</Nav.Link>
                            <Nav.Link onClick={() => auth.logout()}>Logout</Nav.Link>

                        </>
                    ) : (
                        <>
                            <Nav.Link href="/login" className="fw-bold">Login</Nav.Link>
                        </>
                    )}
                </Nav>
            </Container>
        </Navbar>
    );
}