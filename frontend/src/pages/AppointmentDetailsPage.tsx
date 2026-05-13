import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {useNavigate} from "react-router-dom";
import {changeAppointmentPet, findPetByOwnerAndName, getAppointment, getRecordByAppointment} from "../api/api.ts";
import {Button, Card, Col, Container, Form, FormSelect, Row} from "react-bootstrap";
import {isAdmin} from "../api/roles.ts";
import moment from "moment";
import MedicalRecordForm from "./MedicalRecordForm.tsx";

export default function AppointmentDetails() {
    const auth = useContext(AuthContext);
    const [isActive, setIsActive] = useState(false);
    const appointmentId = parseInt(sessionStorage.getItem("appointmentId"));
    const [appointment, setAppointment] = useState(null);
    const [pets, setPets] = useState(null);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [closeCount, setCloseCount] = useState(0);
    const [record, setRecord] = useState(null);

    function openRecordModal() {
        setShowRecordModal(true);
    }

    function closeModalWithCounts() {
        setCloseCount((prev) => prev + 1);
    }

    function activeAppointment(app) {
        if (!app.status.includes("BOOKED")) return false;
        const date = moment(`${app.slot.split(' ')[0].split('.').reverse().join('-')} ${app.slot.split(' ')[1]}`);
        return date.isSameOrAfter(moment());
    }

    async function postData(fd) {
        const selectedPetId = fd.get("pet");
        try {
            const res = await changeAppointmentPet(auth.token, appointmentId, selectedPetId);
            setError(null);
            return res;
        }
        catch (err) {
            setError(err);
        }
    }

    function handleSubmit(e) {
            e.preventDefault();
            postData(new FormData(e.target)).then(res => setAppointment(res));
            setIsActive(false);
            setMessage("Datele au fost salvate cu succes");
            navigate(`/appointments/details`);
    }

    // async function handleConfirm() {
    //     try {
    //         const res = await confirmAppointment(auth.token, appointment.id);
    //         setAppointment(res);
    //         setMessage("Programarea a fost inregistrata ca efectuata!");
    //     }
    //     catch (err) {
    //         setError(err);
    //     }
    // }


    useEffect(() => {
        const fetchAppointment = async() => {
                try {
                    const res = await getAppointment(auth.token, appointmentId);
                    setAppointment(res);
                    const resPet = await findPetByOwnerAndName(auth.token, res.pet.owner.username);
                    setPets(resPet);
                    setError(null);
                    setMessage(null);
                }
                catch(err) {
                    setError(err);

                }
        }
        fetchAppointment();
        const fetchRecord = async() => {
            try {
                const resRecord = await getRecordByAppointment(auth.token, appointmentId);
                setRecord(resRecord);
                setError(null);
                setMessage(null);
            }
            catch(err) {
                setError(err);
            }
        }
        fetchRecord();


        }, [closeCount, record]);



        return <>
            {/*{error && <p className="text-danger">{error}</p>}*/}
            <Container className="d-flex justify-content-center align-items-start" style={{paddingTop: '2.5rem'}}>
                <Row className="w-100 justify-content-center">
                    <Col xs={12} md={8} lg={6}>
                        { error && <p className="text-danger text-center"><small>{error}</small></p> }

                        { appointment ? (
                            <Card className="shadow-sm p-5">
                                <Card.Body>
                                    <Form id="edit-appointment-form" onSubmit={handleSubmit}>
                                        <div className="d-flex flex-column align-items-center">
                                            <h5>{appointment?.slot}</h5>
                                        </div>
                                        <hr />
                                        <Row className="gx-3 gy-2">
                                            <Col xs={6} className="fw-bold">Veterinar</Col>
                                            <Col xs={6}>
                                                {appointment.vet.firstName + ' ' + appointment.vet.lastName} (Clinica: {appointment.clinic ? appointment.clinic.name : 'Clinica nu mai este inregistrata'})
                                            </Col>
                                        </Row>
                                        <Row className="mt-3">
                                        <Col xs={6} className="fw-bold">Animal de companie</Col>
                                            <Col xs={6}>
                                                <Form.Group controlId="pet">
                                                    <FormSelect
                                                        name="pet"
                                                        value={appointment?.pet?.id || ''}
                                                        disabled={!isActive}
                                                        onChange={(e) =>
                                                            setAppointment(prev => ({
                                                                ...prev,
                                                                pet: { ...prev.pet, id: e.target.value }
                                                            }))
                                                        }
                                                    >{pets && pets.length > 0 ? pets.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        )) : <option disabled>Nu s-au găsit animale de companie</option>}
                                                    </FormSelect>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        {appointment.status.includes("CANCELLED") && (<>
                                        <Row className="mt-3">
                                            <Col xs={6} className="fw-bold">Motiv anulare</Col>
                                            <Col xs={6}>{appointment.cancelReason ? appointment.cancelReason : 'N/A'}</Col>
                                        </Row>
                                                <Row className="mt-3">
                                                <Col xs={6} className="fw-bold">Anulat de:</Col>
                                                <Col xs={6}>{appointment.cancelledBy ? appointment.cancelledBy.username : 'N/A'}</Col>
                                            </Row>

                                            </>
                                            )}
                                        <hr />
                                    </Form>
                                </Card.Body>
                                <Card.Footer>
                                    {appointment.vet?.id === auth.user.id && !activeAppointment(appointment) && <>
                                    {!appointment.done &&
                                        <Button variant="success" className="m-2" onClick={openRecordModal}>Confirmare</Button> }
                                    {message === null && appointment.done &&
                                        <Row>
                                            <Col>
                                                <p className="fw-bold text-success pt-2">Efectuat</p>
                                            </Col>
                                            <Col className="text-end">
                                                {record !== null && record.id !== 0 &&
                                                    <Button variant="success" href={"/records/details"} onClick={() => {
                                                    sessionStorage.setItem("recordId", record.id);
                                                }}>Raport medical</Button>}
                                                {record !== null && record.id === 0 &&
                                                    <Button variant="success" className="m-2" onClick={openRecordModal}>Adaugare raport medical</Button>}
                                            </Col>
                                        </Row>
                                    }
                                    </>}
                                    {(appointment.pet.owner.id === auth.user.id || isAdmin(auth.user.roles)) && activeAppointment(appointment) && (
                                        <div className="d-flex justify-content-between gap-2">
                                            {!isActive && <Button variant="primary" onClick={() => setIsActive(true)}>Editare</Button>}
                                            {isActive && (
                                                <Button variant="primary" form="edit-appointment-form" type="submit">Salvare</Button>
                                            )}
                                        </div>
                                    )}
                                    {message && <div className="text-success fw-bold m-2">{message}</div>}
                                </Card.Footer>
                            </Card>
                        ) : (
                            <p className="py-3 text-center">Se încarcă...</p>
                        ) }
                    </Col>
                </Row>
                <MedicalRecordForm open={showRecordModal} save={() => {
                    setShowRecordModal(false);
                    closeModalWithCounts();
                }} close={() => setShowRecordModal(false)} appointment={appointment}/>

            </Container>
        </>

}