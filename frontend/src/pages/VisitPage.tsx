import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {Badge, Button, Card, Col, Container, Row, Table} from "react-bootstrap";
import {useNavigate, useParams} from "react-router-dom";
import {findUserByUsername, getClinicsByVeterinarian} from "../api/api.ts";
import {isAdmin, isPetOwner, isVeterinarian} from "../api/roles.ts";


export default function Visit() {
    const auth = useContext(AuthContext);
    const {username} = useParams();
    const navigate = useNavigate();
    const [visitedUser, setVisitedUser] = useState(null);
    const [clinics, setClinics] = useState(null);

    useEffect(() => {
        const getVisitedUser = async () => {
            try {
                const res = await findUserByUsername(auth.token, username);
                console.log(res);
                setVisitedUser(res);
            } catch (error) {
                console.log(error);
                navigate("/access-denied");
            }
        };
        getVisitedUser();
        if (auth.user.username === username) {
            navigate("/profile");
        }
        const getClinics = async () => {
            try {
                const fetchClinics = await getClinicsByVeterinarian(username);
                setClinics(fetchClinics);
                console.log(fetchClinics);
            } catch (err) {
                console.log(err);
            }
        }
        getClinics();
    }, [username]);



    return (
        <>
        {
            visitedUser && (
            <Container className="d-flex flex-grow-1 py-lg-5" fluid>
                <Row className="text-center align-items-start w-100">
                    <Col md={10} className="mx-auto">
                        <Card className="border-0">
                            <Card.Header>
                                <h1 className="fw-bold">{visitedUser.lastName !== null ? visitedUser.lastName + " " : ""}{visitedUser.firstName !== null ? visitedUser.firstName : ""}
                                </h1>
                            </Card.Header>
                            <Card.Body className="text-start">
                                <p><a href={"/user/" + visitedUser.username}
                                      className="username-link"><small>@</small>{visitedUser.username}</a>
                                    {isPetOwner(visitedUser.roles) ? (
                                        <Badge bg="success">OWNER</Badge>
                                    ) : (
                                        isVeterinarian(visitedUser.roles) ?
                                            <Badge bg="primary">VET</Badge> :
                                            <Badge bg="danger">ADMIN</Badge>
                                    )}
                                </p>
                                <p className="fw-medium">Date de contact</p>
                                <Table>
                                    <tbody>
                                    <tr>
                                        <td className="fw-medium text-secondary">Adresa de email:</td>
                                        <td className="fw-medium"><span>{visitedUser.email ? visitedUser.email : ""}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-secondary">Telefon:</td>
                                        <td className="fw-medium"><span>{visitedUser.phone ? visitedUser.phone : ""}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-secondary">Nume:</td>
                                        <td><span>{visitedUser.lastName ? visitedUser.lastName : ""}</span></td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-secondary">Prenume:</td>
                                        <td><span>{visitedUser.firstName ? visitedUser.firstName : ""}</span></td>
                                    </tr>
                                   {
                                        isVeterinarian(visitedUser.roles) && clinics !== null && clinics.length !== 0 &&
                                            <tr>
                                                <td className="fw-medium text-secondary">Clinici:</td>
                                                <td>
                                                    {
                                                    clinics.map((c, i) => <p key={c.id}><span>{c.name}</span>{(i !== (clinics.length - 1)) && <br/>}</p>)
                                                    }
                                                </td>
                                            </tr>
                                   }
                                    </tbody>
                                </Table>
                                {
                                    (isAdmin(auth.user.roles) || isVeterinarian(auth.user.roles)) &&
                                    <Button variant="secondary" className="mt-2" href={`/pets/${visitedUser.username}`}>Animale asociate</Button>
                                }
                                {
                                    (isAdmin(auth.user.roles) || isVeterinarian(auth.user.roles) || (auth.user.username === username)) &&
                                    <Button variant="secondary" className="mt-2 mx-2" href={`/ask/history/${visitedUser.username}`}>Istoric intrebari</Button>
                                }
                            </Card.Body>
                        </Card>
                        <br/>
                    </Col>

                </Row>
            </Container>)
}
        </>
    );
}
