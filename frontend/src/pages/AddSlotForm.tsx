import {useContext, useEffect, useState} from "react";
import {Button, Form, Modal, Row, Col, FormSelect} from "react-bootstrap";
import {addSlots, getClinicsByVeterinarian} from "../api/api.ts";
import {AuthContext} from "../api/authContext.ts";
import {DatePicker} from "rsuite";

export default function AddSlotForm(props) {
    const auth = useContext(AuthContext);
    const [error, setError] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [slot, setSlot] = useState(new Date());

    useEffect(() => {
        const fetchClinics = async () => {
            const res = await getClinicsByVeterinarian(auth.user.username);
            setClinics(res);
        }
        fetchClinics();
    }, []);


    async function postData(formData) {
        const clinic = formData.get("clinic");
        const slotsCount = formData.get("slotsCount");
        const saveSlot = async () => {
            try {
                const options = {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                } as const;
                const startSlot = new Intl.DateTimeFormat('en-GB', options).format(slot).replaceAll('/', '.').replace(', ', ' ');
                console.log(startSlot);
                await addSlots(auth.token, auth.user, clinic, startSlot, slotsCount);
                setError(null);
                props.save();
            } catch (err) {
                setError(err.message);
            }
        }
        saveSlot();
    }

    function handleSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        postData(fd);
    }

    return <>
        <Modal show={props.open} onHide={() => {props.close(); setError(null)}} centered>
            <Modal.Header closeButton className="border-bottom pb-3">
                <Modal.Title className="fw-semibold">Adaugă sloturi</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 py-3">
                {error && error.split('\n').map(err => <p key={err.split(' ')[0]} className="text-danger mb-1"><small>{err}</small>
                </p>)}
                <Form id="add-slots-form" onSubmit={handleSubmit}>
                    <Row className="g-3">
                        <Col xs={12} md={6}>
                            <Form.Group controlId="clinic">
                                <Form.Label className="fw-medium mb-1">Clinica</Form.Label>
                                <FormSelect name="clinic" defaultValue={clinics.length !== 0 ? clinics[0].id: ''} aria-label="Clinica" required>
                                    {clinics && clinics.length > 0 ? clinics.map(clinic => (
                                        <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                                    )) : <option disabled>Nu s-au găsit clinici</option>}
                                </FormSelect>
                            </Form.Group>
                        </Col>

                        <Col xs={12} md={6}>
                            <Form.Group controlId="slot-start">
                                <Form.Label className="fw-medium mb-1">Data start</Form.Label>
                                <div>
                                    <DatePicker
                                        format="dd.MM.yyyy HH:mm"
                                        value={slot}
                                        onChange={setSlot}
                                        style={{width: '100%'}}
                                        container={() => document.body}
                                        oneTap={false}
                                    />
                                </div>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group controlId="slots-number">
                                <Form.Label className="fw-medium mb-1">Numar sloturi (durata interval = 30 min)</Form.Label>
                                {
                                        <Form.Control name="slotsCount" type="number" min={1} max={20} defaultValue={1} required/>
                                }
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-top pt-3">
                <Button variant="secondary" onClick={() => {props.close(); setError(null)}}>Închide</Button>
                <Button type="submit" variant="primary" form="add-slots-form">Salvare</Button>
            </Modal.Footer>
        </Modal>
    </>
}