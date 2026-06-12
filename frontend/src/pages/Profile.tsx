import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {Badge, Button, Card, Col, Container, Form, FormControl, Row, Table} from "react-bootstrap";
import {
    updateData,
    deleteUser,
    getClinicsByVeterinarian,
    getUpcomingOwnerAppointments,
    getUpcomingVetAppointments
} from "../api/api.ts";
import VetRequest from "../components/VetRequest.tsx";
import {isAdmin, isPetOwner, isVeterinarian} from "../api/roles.ts";
import Confirm from "../components/Confirm.tsx";
import {useNavigate} from "react-router-dom";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";

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
    const [upcomingOwnerAppointments, setUpcomingOwnerAppointments] = useState([]);
    const [upcomingVetAppointments, setUpcomingVetAppointments] = useState([]);
    const navigate = useNavigate();
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [deletionError, setDeletionError] = useState(null);

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

        const fetchUpcomingOwnerAppointments = async () => {
            try {
                const res = await getUpcomingOwnerAppointments(auth.token, 5);
                setUpcomingOwnerAppointments(res);
            }
            catch(err) {
                console.log(err);
            }
        }
        fetchUpcomingOwnerAppointments();

        const fetchUpcomingVetAppointments = async () => {
            try {
                const res = await getUpcomingVetAppointments(auth.token, 5);
                setUpcomingVetAppointments(res);
            }
            catch(err) {
                console.log(err);
            }
        }
        if (isVeterinarian(auth.user.roles)) {
            fetchUpcomingVetAppointments();
        }
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
        try {
            await deleteUser(auth.token, auth);
            auth.logout();
            setDeletionError(null);
        }
        catch(err) {
            setDeletionError(err.message);
            setShowError(true);
        }
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
                            <br/>
                            <Button variant="secondary" href={`/pets/${auth.user.username}`} className="mt-2">Animalele mele</Button>
                            <h4 className="mt-5 mb-2 text-center">Programari viitoare</h4>
                            <Table className="mb-5">
                                <thead>
                                <tr>
                                    <td>Data</td>
                                    <th>Animal de companie</th>
                                    <th>Veterinar</th>
                                    <th>Clinica</th>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    upcomingOwnerAppointments && upcomingOwnerAppointments.length > 0 ? upcomingOwnerAppointments.map(app => (
                                        <tr key={app.id}>
                                            <td className="linked-row" onClick={() => {
                                                sessionStorage.setItem("appointmentId", app.id.toString());
                                                navigate("/appointments/details");
                                            }}>{app.slot}</td>
                                            <td className="linked-row" onClick={() => {
                                                navigate(`/pets/${auth.user.username}/${app.pet.name}`);}}>{app.pet.name}</td>
                                            <td className="linked-row" onClick={() => {
                                                navigate(`/user/${auth.user.username}`);}}>{app.vet.firstName} {app.vet.lastName}</td>
                                            <td className="linked-row" onClick={() => {
                                                navigate(`/clinics/${app.clinic.id}`);}}>{app.clinic.name}</td>
                                        </tr>
                                    )) : <tr><td colSpan={4} className="text-center">Nu exista programari viitoare</td></tr>
                                }
                                </tbody>
                            </Table>
                            {
                                isVeterinarian(auth.user.roles) && (
                                    <>
                                        <h4 className="mt-5 mb-2 text-center">Programari viitoare ca veterinar</h4>
                                        <Table className="mb-5">
                                            <thead>
                                            <tr>
                                                <td>Data</td>
                                                <th>Animal de companie</th>
                                                <th>Proprietar</th>
                                                <th>Clinica</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {
                                                upcomingVetAppointments && upcomingVetAppointments.length > 0 ? upcomingVetAppointments.map(app => (
                                                    <tr key={app.id}>
                                                        <td onClick={() => {
                                                            sessionStorage.setItem("appointmentId", app.id.toString());
                                                            navigate("/appointments/details");
                                                        }}
                                                        className="linked-row">{app.slot}</td>
                                                        <td className="linked-row" onClick={() => {
                                                            if (app.pet && app.pet.owner) {
                                                            navigate(`/pets/${app.pet.owner.username}/${app.pet.name}`);}
                                                        }}>{app.pet?.name}</td>
                                                        <td className="linked-row" onClick={() => {
                                                            if (app.pet && app.pet.owner) {
                                                            navigate(`/user/${app.pet.owner.username}`);
                                                            }}}
                                                        >{app.pet?.owner?.firstName} {app.pet?.owner?.lastName}</td>
                                                        <td className="linked-row" onClick={() => {
                                                            if (app.clinic) {
                                                            navigate(`/clinics/${app.clinic.id}`);
                                                            }}}
                                                        >{app.clinic?.name}</td>
                                                    </tr>
                                                )) : <tr><td colSpan={4} className="text-center">Nu exista programari viitoare</td></tr>
                                            }
                                            </tbody>
                                        </Table>
                                    </>
                                )
                            }
                        </Card.Body>
                    </Card>
                    <br/>
                </Col>
            </Row>
        </Container>
            <Confirm open={showDeleteConfirm} close={closeDeleteConfirm} confirm={deleteAccount} message="Sunteti sigur ca doriti stergerea contului? Aceasta actiune este iremediabila."/>
            <SuccessToast close={() => setShowSuccess(false)} show={showSuccess} message=""/>
            <ErrorToast close={() => setShowError(false)} show={showError} message={deletionError}/>
        </>
    );
}
