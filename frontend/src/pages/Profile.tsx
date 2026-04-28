import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {Badge, Button, Card, Col, Container, Form, FormControl, Row, Table} from "react-bootstrap";
import {updateData, deleteUser, getClinicsByVeterinarian} from "../api/api.ts";
import VetRequest from "../components/VetRequest.tsx";
import {isAdmin, isPetOwner, isVeterinarian} from "../api/roles.ts";
import Confirm from "../components/Confirm.tsx";

export default function Profile() {
    const auth = useContext(AuthContext);
    const [edit, setEdit] = useState(false);
    const [email, setEmail] = useState(auth.user.email || '');
    const [phone, setPhone] = useState(auth.user.phoneNumber || '');
    const [lastName, setLastName] = useState(auth.user.lastName || '');
    const [firstName, setFirstName] = useState(auth.user.firstName || '');
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [clinics, setClinics] = useState([]);


    useEffect(() => {
        const getClinics = async () => {
            try {
                const fetchClinics = await getClinicsByVeterinarian(auth.user.username);
                setClinics(fetchClinics);
                console.log(fetchClinics);
            } catch (err) {
                console.log(err);
            }
        }
        getClinics();
    }, [auth.token]);

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
    }

    async function editData() {
        const user =  {
            id: auth.user.id,
            username: auth.user.username,
            email: auth.user.email !== email ? email : auth.user.email,
            phoneNumber: auth.user.phoneNumber !== phone ? phone : auth.user.phoneNumber,
            lastName: auth.user.lastName !== lastName ? lastName : auth.user.lastName,
            firstName: auth.user.firstName !== firstName ? firstName : auth.user.firstName,
        }
        try {
            if (phone !== '' && !/^\d{10}$/.test(phone)) {
                setError("phone: Numarul de telefon trebuie sa contina exact 10 cifre.\n");
                return;
            }
            const res = await updateData(auth.token, user);
            auth.setUser(res);
            setError(null);
            setEdit(false);
        }
        catch(err) {
            setError(err.message);
        }
    }

    async function deleteAccount() {
        auth.logout();
        await deleteUser(auth.token, auth);
    }

    return (
        <>
        <Container className="d-flex flex-grow-1 py-lg-5" fluid>
            <Row className="text-center align-items-start w-100">
                <Col md={7} className="mx-auto">
                    <Card className="border-0">
                        <Card.Header>
                            <h1>Bine ai venit, <span className="fw-bold">{auth.user.lastName} {auth.user.firstName}</span>!
                            </h1>
                        </Card.Header>
                        <Card.Body className="text-start">
                            <p><a href="/profile" className="username-link"><small>@</small>{auth?.user?.username}</a>
                                {isPetOwner(auth.user.roles) ? (
                                    <Badge bg="success">OWNER</Badge>
                                ) : (
                                    isVeterinarian(auth.user.roles) ?
                                    <Badge bg="primary">VET</Badge> : <Badge bg="warning">ADMIN</Badge>
                                )}
                            </p>
                            <p className="fw-bold mx-2">Date de contact</p>
                            <Form action={editData} id="edit-form">
                            <Table>
                                <tbody>
                                {/*{error && edit && <tr><td colSpan={2} className="text-danger">{error.split('\n').map(err => <p key={err.split(":")[0]}><small>{err}</small></p>)}</td></tr>}*/}
                                <tr>
                                    <td className="fw-medium text-secondary" >Adresa de email: </td>
                                    <td className="fw-medium">
                                        {error && error.includes("email") && edit && (error.split('\n').filter(err => err.toLowerCase().includes("email")).map(err => <p key={err.split(":")[0] + (err.length).toString()} className="text-danger mb-1"><small>{err.split(": ")[1]}</small></p>))}
                                        <FormControl value={email} onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (error && error.includes("email")) {
                                                setError(error.split('\n').filter(err => !err.toLowerCase().includes("email")).join('\n'));
                                            }
                                            }
                                        } name="email" disabled={!edit} type="text" required isInvalid={error && error.includes("email")}/>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="fw-medium text-secondary">Telefon: </td>
                                    <td className="fw-medium">
                                        {error && error.includes("phone") && edit && (error.split('\n').filter(err => err.toLowerCase().includes("phone")).map(err => <p key={err.split(":")[0]} className="text-danger mb-1"><small>{err.split(": ")[1]}</small></p>))}
                                        <FormControl value={phone} onChange={(e) => {
                                            setPhone(e.target.value);
                                            if (error && error.includes("phone")) {
                                                setError(error.split('\n').filter(err => !err.toLowerCase().includes("phone")).join('\n'));
                                            }
                                        }}
                                        name="phone" disabled={!edit} type="text" isInvalid={error && error.includes("phone")}/>
                                        </td>
                                </tr>
                                {isVeterinarian(auth.user.roles) &&
                                    <tr>
                                        <td className="fw-medium text-secondary">Clinici:</td>
                                        <td className="text-center">{clinics.length !== 0 ? clinics.map(((c, i) => <p key={c.id}><span>{c.name}</span>{(i !== (clinics.length - 1)) && <br/>}</p>)) : <p>Fara clinici asociate</p>}</td>
                                    </tr>
                                }
                                {
                                    edit && (<>
                                        <tr>
                                            <td className="fw-medium text-secondary">Nume: </td>
                                            <td>
                                                {error && error.includes("lastName") && edit && (error.split('\n').filter(err => err.toLowerCase().includes("lastname")).map(err => <p key={err.split(":")[0]} className="text-danger mb-1"><small>{err.split(": ")[1]}</small></p>))}
                                                <FormControl value={lastName} onChange={(e) => {
                                                    setLastName(e.target.value);
                                                    if (error && error.split('\n').filter(err => err.toLowerCase().includes("lastname")).length > 0) {
                                                        setError(error.split('\n').filter(err => !err.toLowerCase().includes("lastname")).join('\n'));
                                                    }}
                                                } name="lastName" type="text" required isInvalid={error && error.includes("lastName")}/>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="fw-medium text-secondary">Prenume: </td>
                                            <td>
                                                {error && error.includes("firstName") && edit && (error.split('\n').filter(err => err.toLowerCase().includes("firstname")).map(err => <p key={err.split(":")[0]} className="text-danger mb-1"><small>{err.split(": ")[1]}</small></p>))}
                                                <FormControl value={firstName} onChange={(e) => {
                                                    setFirstName(e.target.value);
                                                    if (error && error.split('\n').filter(err => err.toLowerCase().includes("firstname")).length > 0) {
                                                        setError(error.split('\n').filter(err => !err.toLowerCase().includes("firstname")).join('\n'));
                                                    }
                                                }
                                                } name="firstName" type="text" required isInvalid={error && error.includes("firstName")}/>
                                            </td>
                                        </tr>
                                    </>)
                                }
                                </tbody>
                            </Table>
                            </Form>
                            {edit && <Button variant="primary" type="submit" form="edit-form">Salvare</Button>}
                            {edit && <Button variant="secondary" className="mx-2" onClick={() => {setEdit(false); setError(null)}}>Renuntare</Button>}
                            {!edit && <Button variant="success" type="button" onClick={() => {setEdit(true)}}>Editare</Button>}
                                <Button onClick={() => {
                                    setShowDeleteConfirm(true);
                                }} variant="danger" className="mx-2">Stergere cont</Button>
                            {
                                isPetOwner(auth.user.roles) && (
                                        <VetRequest auth={auth}/>
                                )
                            }
                            {
                                isVeterinarian(auth.user.roles) && (
                                    <p className="pt-3">
                                        In cadrul platformei, detineti titlul de medic veterinar
                                    </p>
                                )
                            }
                            {
                                isAdmin(auth.user.roles) && (
                                    <Button as="a" href="/requests-list" variant="success">Vizualizeaza cereri</Button>
                                )
                            }
                        </Card.Body>
                    </Card>
                    <br/>
                </Col>
            </Row>
        </Container>
            <Confirm open={showDeleteConfirm} close={closeDeleteConfirm} confirm={deleteAccount} message="Sunteti sigur ca doriti stergerea contului? Aceasta actiune este iremediabila."/>
        </>
    );
}
