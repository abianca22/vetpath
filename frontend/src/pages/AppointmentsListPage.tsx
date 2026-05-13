import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {Button, Col, Container, Form, FormSelect, Row, Table} from "react-bootstrap";
import {getAllClinics, getAppointments} from "../api/api.ts";
import AddAppointmentForm from "./AddAppointmentForm.tsx";
import CancelAppointmentForm from "../components/CancelAppointmentForm.tsx";
import {useNavigate} from "react-router-dom";
import {DatePicker} from "rsuite";
import moment from "moment/moment";

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

    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
        vetUsername: '',
        petName: '',
        petOwner: '',
        status: '',
        clinic: ''
    });

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
        const findAppointments = async () => {
            const res = await getAppointments(auth.token);
            setAppointments(res);
        }
        findAppointments();
        const findClinics = async () => {
            const res = await getAllClinics();
            setClinics(res);
        }
        findClinics();
    }, [closeCount, cancelCloseCount]);

    const handleFilterSubmit = (e) => {
        e.preventDefault();

        const selectedFilters = Object.fromEntries(
            Object.entries(filters)
                // .filter(([, value]) => value !== null && value !== "")
        );

        // const fetchFilteredAppointments = async() => {
        //     try {
        //
        //         const res = await fetchAppointments(auth.token, filters.startDate, filters.endDate, null, filters.vetUsername !== '' ? filters.vetUsername : null, filters.clinic !== '' ? filters.clinic : null, filters.status !== '' ? filters.status : null, filters.petOwner !== '' ? filters.petOwner : null);
        //         setAppointments(res);
        //         setError(null)
        //     }
        //      catch(err) {
        //          setError(err);
        //      }
        // }
        // fetchFilteredAppointments();

        console.log(selectedFilters);
    };

    return (
        <Container className="d-flex flex-grow-1" fluid>
            <Row className="align-items-start h-100 w-100 justify-content-center">
                <Col className="col-9">
                    <h1 className="m-5 text-center">Programari</h1>

                    <Form onSubmit={handleFilterSubmit} className="mb-3">
                        <Row className="g-2">
                            <Col md={3}>
                                <DatePicker
                                    format="dd.MM.yyyy HH:mm"
                                    value={filters.startDate}
                                    onChange={(value) => setFilters(prev => ({...prev, startDate: value}))}
                                    style={{width: "100%"}}
                                    placeholder="Start date"
                                    container={() => document.body}
                                    oneTap={false}
                                />
                            </Col>
                            <Col md={3}>
                                <DatePicker
                                    format="dd.MM.yyyy HH:mm"
                                    value={filters.endDate}
                                    onChange={(value) => setFilters(prev => ({...prev, endDate: value}))}
                                    style={{width: "100%"}}
                                    placeholder="End date"
                                    container={() => document.body}
                                    oneTap={false}
                                />
                            </Col>
                            <Col md={3}>
                                <Form.Control
                                    type="text"
                                    value={filters.vetUsername}
                                    onChange={(e) => setFilters(prev => ({...prev, vetUsername: e.target.value}))}
                                    placeholder="Vet username"
                                />
                            </Col>
                            <Col md={3}>
                                <Form.Control
                                    type="text"
                                    value={filters.petName}
                                    onChange={(e) => setFilters(prev => ({...prev, petName: e.target.value}))}
                                    placeholder="Pet name"
                                />
                            </Col>
                            <Col md={3} className="d-flex align-items-end">
                                <Form.Control
                                    type="text"
                                    value={filters.petOwner}
                                    onChange={(e) => setFilters(prev => ({...prev, petOwner: e.target.value}))}
                                    placeholder="Pet owner"
                                />
                            </Col>
                            <Col md={3}>
                                <Form.Label>Status</Form.Label>
                                <FormSelect
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                                >
                                    <option value="">Toate</option>
                                    <option value="BOOKED">Active</option>
                                    <option value="CANCELLED">Anulate</option>
                                </FormSelect>
                            </Col>
                            <Col md={3}>
                                <Form.Label>Clinica</Form.Label>
                                <FormSelect
                                    value={filters.clinic}
                                    onChange={(e) => setFilters(prev => ({...prev, clinic: e.target.value}))}
                                >
                                    <option value="">Toate</option>
                                    {clinics && clinics.length > 0 ? clinics.map(clinic => (
                                            <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                                        )) :
                                        <option>Nu s-au găsit clinici</option>}
                                </FormSelect>
                            </Col>
                            <Col md={1} className="d-flex align-items-center">
                                <Button type="submit">Filtrare</Button>
                            </Col>
                            <Col md={2} className="d-flex align-items-center">
                                <Button variant="primary mx-2" onClick={openAddModal}>Adaugare programare</Button>
                            </Col>
                        </Row>
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
                                        <td>{app.vet.username}</td>
                                        <td>{app.clinic ? app.clinic.name : ''}</td>
                                        <td>{app.pet.name} ({app.pet.owner.username})</td>
                                        <td>{app.status.includes('BOOKED') ? 'Activa' : `Anulata de ${app.cancelledBy.username}`}</td>
                                        <td>
                                            <Button variant="primary" onClick={() => {sessionStorage.setItem("appointmentId", app.id.toString()); navigate('/appointments/details');}}>Detalii</Button>
                                            {(app.vet.id === auth.user.id || app.pet.owner.id === auth.user.id) && app.status.includes('BOOKED') && !pastAppointment(app) && <Button variant="danger" className="m-1" onClick={() => {setCurrentAppointment(app); openCancelModal();}}>Anulare</Button>}
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
            <AddAppointmentForm open={showAddModal} save={closeAddModalWithCount} close={closeAddModalNoCount} reload={cancelCloseCount} appointments={appointments}/>
            <CancelAppointmentForm open={showCancelModal} save={closeCancelModalWithCount} close={closeCancelModalNoCount} slot={currentAppointment}/>
       </Container>
    );
}