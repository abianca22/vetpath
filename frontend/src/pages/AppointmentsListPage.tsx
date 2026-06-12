import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {Button, Col, Container, Form, FormSelect, Row, Table} from "react-bootstrap";
import {getAllClinics, getAppointments, sendEmail} from "../api/api.ts";
import AddAppointmentForm from "./AddAppointmentForm.tsx";
import CancelAppointmentForm from "../components/CancelAppointmentForm.tsx";
import {useNavigate, useSearchParams} from "react-router-dom";
import {DatePicker} from "rsuite";
import moment from "moment/moment";
import {isPetOwner, isVeterinarian} from "../api/roles.ts";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";

export default function AppointmentsList() {
    const auth = useContext(AuthContext);
    const [appointments, setAppointments] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [closeCount, setCloseCount] = useState(0);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelCloseCount, setCancelCloseCount] = useState(0);
    const [currentAppointment, setCurrentAppointment] = useState(null);
    const navigate = useNavigate();
    const [clinics, setClinics] = useState([]);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [lastVet, setLastVet] = useState("");
    const [lastPet, setLastPet] = useState("");
    const [lastOwner, setLastOwner] = useState("");
    const [lastAppStatus, setLastAppStatus] = useState("");
    const [lastClinic, setLastClinic] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const openAddModal = () => {
        setShowAddModal(true);
    }
    const closeAddModalWithCount = () => {
        setShowAddModal(false);
        setCloseCount(prev => prev + 1);
    }
    const closeAddModalNoCount = () => {
        setShowAddModal(false);
    }

    const openCancelModal = () => {
        setShowCancelModal(true);
    }
    const closeCancelModalWithCount = () => {
        setShowCancelModal(false);
        setCurrentAppointment(null);
        setCancelCloseCount(prev => prev + 1);
    }
    const closeCancelModalNoCount = () => {
        setShowCancelModal(false);
        setCurrentAppointment(null);
        setError(null);
    }

    function pastAppointment(app) {
        const date = moment(`${app.slot.split(' ')[0].split('.').reverse().join('-')} ${app.slot.split(' ')[1]}`);
        return date.isSameOrBefore(moment());
    }

    useEffect(() => {
        const loadSearchParams = () => {
            if (searchParams.get("startDate") !== null) {
                let date = [];
                date.push(...searchParams.get("startDate").split('.'));
                date = date.map(component => parseInt(component));
                setStartDate(new Date(date[2], date[1], date[0]));
            }
            if (searchParams.get("endDate") !== null) {
                let date = [];
                date.push(...searchParams.get("endDate").split('.'));
                date = date.map(component => parseInt(component));
                setEndDate(new Date(date[2], date[1], date[0]));
            }
        }
        loadSearchParams();
        const loadPendingNotifications = async () => {
            if (sessionStorage.getItem("sendEmailAppointmentId") !== null) {
                try {
                    await sendEmail(auth.token, sessionStorage.getItem("sendEmailAppointmentId"));
                    sessionStorage.removeItem("sendEmailAppointmentId")
                }
                catch(err) {
                    setError(err);
                }
            }
        }
        loadPendingNotifications();
        const findAppointments = async () => {
            const res = await getAppointments(auth.token, null, null, null, null, null, null, null, null);
            console.log(res);
            setAppointments(res);
        }
        findAppointments();
        const findClinics = async () => {
            const res = await getAllClinics(null, null);
            setClinics(res);
        }
        findClinics();
    }, [closeCount, cancelCloseCount]);

    async function handleFilterSubmit(e)  {
        e.preventDefault();
        let start = null;
        let end = null;
        if (startDate !== null) {
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            } as const;
            start = new Intl.DateTimeFormat('en-GB', options).format(startDate).replaceAll('/', '.').replace(', ', ' ');
        }
        if (endDate !== null) {
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            } as const;
            end = new Intl.DateTimeFormat('en-GB', options).format(endDate).replaceAll('/', '.').replace(', ', ' ');
        }
        if (start !== null && end !== null) {
            setSearchParams({startDate: start, endDate: end});
        } else if (start !== null) {
            setSearchParams({startDate: start});
        } else if (end !== null) {
            setSearchParams({endDate: end});
        } else {
            setSearchParams({});
        }
        const formData = new FormData(e.target);
        let vet = formData.get("vet");
        let pet = formData.get("pet");
        let owner = formData.get("owner");
        let appStatus = formData.get("appStatus");
        let clinic = formData.get("clinic");
        setLastVet(vet.toString());
        setLastPet(pet.toString());
        setLastOwner(owner.toString());
        setLastAppStatus(appStatus.toString());
        setLastClinic(clinic.toString());
        if (vet === '' || vet === undefined) {
            vet = null;
        }
        if (pet === '' || pet === undefined) {
            pet = null;
        }
        if (owner === '' || owner === undefined) {
            owner = null;
        }
        if (appStatus === '' || appStatus === undefined) {
            appStatus = null;
        }
        if (clinic === '' || clinic === undefined) {
            clinic = null;
        }
        try {
            const res = await getAppointments(auth.token, pet, owner, start, end, appStatus !== null ? (appStatus === 'BOOKED') : null, null, clinic, vet);
            setAppointments(res);
            setError(null);
        }
        catch(err) {
            setError(err);
            setAppointments([]);
        }

    };

    return (
        <Container className="d-flex flex-grow-1" fluid>
            <Row className="align-items-start h-100 w-100 justify-content-center">
                <Col className="col-9">
                    <h1 className="m-5 text-center">Programari</h1>
                    <Form onSubmit={handleFilterSubmit} className="mb-3 d-flex">
                            <Form.Group className="m-2 d-flex align-items-end">
                                <DatePicker
                                    format="dd.MM.yyyy"
                                    value={startDate}
                                    style={{width: "100%"}}
                                    placeholder="Start date"
                                    container={() => document.body}
                                    onChange={setStartDate}
                                    oneTap={false}
                                />
                            </Form.Group>
                            <Form.Group className="m-2 d-flex align-items-end">
                                <DatePicker
                                    format="dd.MM.yyyy"
                                    value={endDate}
                                    onChange={setEndDate}
                                    style={{width: "100%"}}
                                    placeholder="End date"
                                    container={() => document.body}
                                    oneTap={false}
                                />
                            </Form.Group>
                            <Form.Group className={`d-flex align-items-end${!isVeterinarian(auth.user.roles) ? ' m-2' : ''}`}>
                                <Form.Control
                                    type="text"
                                    value={lastVet}
                                    onChange={(e) => setLastVet(e.target.value)}
                                    placeholder="Vet username"
                                    name="vet"
                                    hidden={isVeterinarian(auth.user.roles)}
                                />
                            </Form.Group>
                            <Form.Group className="m-2 d-flex align-items-end">
                                <Form.Control
                                    type="text"
                                    value={lastPet}
                                    onChange={(e) => setLastPet(e.target.value)}
                                    name="pet"
                                    placeholder="Pet name"
                                />
                            </Form.Group>
                            <Form.Group className={`d-flex align-items-end${!isPetOwner(auth.user.roles) ? ' m-2': ''}`}>
                                <Form.Control
                                    type="text"
                                    value={lastOwner}
                                    onChange={(e) => setLastOwner(e.target.value)}
                                    placeholder="Pet owner"
                                    name="owner"
                                    hidden={isPetOwner(auth.user.roles)}
                                />
                            </Form.Group>
                            <Form.Group className="m-2 d-flex align-items-end">
                                <Form.Label>Status</Form.Label>
                                <FormSelect
                                    name="appStatus"
                                    value={lastAppStatus}
                                    onChange={(e) => setLastAppStatus(e.target.value)}
                                >
                                    <option value="">Toate</option>
                                    <option value="BOOKED">Active</option>
                                    <option value="CANCELLED">Anulate</option>
                                </FormSelect>
                            </Form.Group>
                            <Form.Group className="m-2 d-flex align-items-end">
                                <Form.Label>Clinica</Form.Label>
                                <FormSelect
                                    value={lastClinic}
                                    name="clinic"
                                    onChange={(e) => setLastClinic(e.target.value)}
                                >
                                    <option value="">Toate</option>
                                    {clinics && clinics.length > 0 ? clinics.map(clinic => (
                                            <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                                        )) :
                                        <option>Nu s-au găsit clinici</option>}
                                </FormSelect>
                            </Form.Group>
                            <Form.Group className="d-flex align-items-end m-2">
                                <Button type="submit" className="mx-2">Filtrare</Button>
                                <Button variant="secondary" type="button" onClick={() => {
                                    setStartDate(null);
                                    setEndDate(null);
                                    setLastVet("");
                                    setLastPet("");
                                    setLastOwner("");
                                    setLastAppStatus("");
                                    setLastClinic("");
                                    setSearchParams({});
                                }}>Resetare</Button>
                            </Form.Group>
                            <Form.Group className="d-flex align-items-end">
                                <Button variant="primary mx-2" onClick={openAddModal}>Adaugare programare</Button>
                            </Form.Group>
                    </Form>

                    {error && error.split('\n').map((err, index) => <p key={index} className="text-danger mb-1"><small>{err}</small></p>)}
                    <div className="table-responsive text-center">
                        <Table className="mt-5">
                            <thead>
                            <tr>
                                <th>Start (durata 30 min)</th>
                                <th>Veterinar</th>
                                <th>Clinica</th>
                                <th>Animal de companie</th>
                                <th>Status</th>
                                <th>Actiuni</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                appointments && appointments.length > 0 ? appointments.map(app => (
                                    <tr key={app.id}>
                                        <td>{app.slot}</td>
                                        <td>{app.vet?.username}</td>
                                        <td>{app.clinic ? app.clinic?.name : ''}</td>
                                        <td>{app.pet ? app.pet.name: "Animal de companie inexistent"} ({(app.pet && app.pet.owner ? app.pet.owner.username : (app.currentOwner ? app.currentOwner.username : "Utilizator inexistent"))})</td>
                                        <td>{app.status.includes('BOOKED') ? (pastAppointment(app) ? (app.done ? 'Efectuata' : 'Neefectuata') : 'Activa') : (app.cancelledBy ? `Anulata de ${app.cancelledBy.username}` : 'Anulata')}</td>
                                        <td>
                                            <Button variant="primary" onClick={() => {sessionStorage.setItem("appointmentId", app.id.toString()); navigate('/appointments/details');}}>Detalii</Button>
                                            {(app.vet?.id === auth.user.id || app.pet?.owner?.id === auth.user.id) && app.status.includes('BOOKED') && !pastAppointment(app) && <Button variant="danger" className="m-1" onClick={() => {setCurrentAppointment(app); openCancelModal();}}>Anulare</Button>}
                                        </td>
                                    </tr>
                                )) : <tr>
                                    <td colSpan={6}>Nu exista rezultate</td>
                                </tr>
                            }
                            </tbody>
                        </Table>
                    </div>
                </Col>
            </Row>
            <AddAppointmentForm showToast={() => {
                    setShowSuccess(true);
                    setSuccessMessage("Programarea a fost salvata cu succes");
                }}
                                open={showAddModal}
                                save={closeAddModalWithCount}
                                close={closeAddModalNoCount}
                                reload={cancelCloseCount}
                                appointments={appointments}
            />
            <CancelAppointmentForm  showToast={() => {
                setShowSuccess(true);
                setSuccessMessage("Programarea a fost anulata cu succes");
            }}
                                    open={showCancelModal} save={closeCancelModalWithCount} close={closeCancelModalNoCount} slot={currentAppointment}/>
            <SuccessToast close={() => setShowSuccess(false)} show={showSuccess} message={successMessage}/>
            <ErrorToast close={() => setShowError(false)} show={showError} message={error}/>
        </Container>
    );
}