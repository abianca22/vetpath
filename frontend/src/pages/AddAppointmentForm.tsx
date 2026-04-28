import {useContext, useEffect, useState} from "react";
import {Button, Form, Modal, Row, Col, FormSelect} from "react-bootstrap";
import {
    addAppointment,
    findPetByOwnerAndName,
    getAllClinics,
    getClinicById,
    getSlots
} from "../api/api.ts";
import {AuthContext} from "../api/authContext.ts";

export default function AddAppointmentForm(props) {
    const auth = useContext(AuthContext);
    const [error, setError] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [vets, setVets] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [selectedVet, setSelectedVet] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [selectedPet, setSelectedPet] = useState(null);
    const [pets, setPets] = useState([]);

    async function loadVetsByClinic(clinicId) {
        const currentSelectedClinic = await getClinicById(clinicId);

        setVets((currentSelectedClinic.vets !== null && currentSelectedClinic.vets !== undefined) ? currentSelectedClinic.vets : []);
        if (currentSelectedClinic.vets.length !== 0) {
            setSelectedVet(currentSelectedClinic.vets[0].id);
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            } as const;
            const date = new Intl.DateTimeFormat('en-GB', options).format(new Date()).replaceAll('/', '.').replace(', ', ' ');
            let availableSlots = await getSlots(auth.token, currentSelectedClinic.vets[0].username, date, null);
            availableSlots = availableSlots.filter(slot => slot.status.includes('AVAILABLE') && slot.clinic.id === clinicId);
            setSlots(availableSlots);
            if (availableSlots.length !== 0) {
                setSelectedSlot(availableSlots[0].id.toString());
            }
            await loadSlotsByVet(currentSelectedClinic.vets[0].id, currentSelectedClinic.id);
        }
    }


    async function loadSlotsByVet(vetId, clinicId) {
        console.log(vetId, clinicId);
        const vet = vets.find(v => v.id === vetId);
        if (!vet) return;
        const vetUsername = vet.username;
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        } as const;
        const date = new Intl.DateTimeFormat('en-GB', options).format(new Date()).replaceAll('/', '.').replace(', ', ' ');
        let availableSlots = await getSlots(auth.token, vetUsername, date, null);
        availableSlots = availableSlots.filter(slot => slot.status.includes('AVAILABLE') && slot.clinic.id === clinicId);
        setSlots(availableSlots);
        if (availableSlots.length !== 0) {
            setSelectedSlot(availableSlots[0].id.toString());
        }
    }


    useEffect(() => {
        const fetchClinics = async() => {
            const res = await getAllClinics();
            setClinics(res);
            if (res.length !== 0 && selectedClinic === null) {
                setSelectedClinic(res[0].id);
                await loadVetsByClinic(res[0].id);
            }
        }
        fetchClinics();

        const fetchPets = async() => {
            const res = await findPetByOwnerAndName(auth.token, auth.user.username);
            setPets(res);
            if (res.length !== 0 && selectedPet === null) {
                setSelectedPet(res[0].id);
            }
        }
        fetchPets();
    }, [auth.token]);


    useEffect(() => {
        console.log(selectedPet, selectedClinic);
        loadSlotsByVet(selectedVet, selectedClinic);
    }, [props.reload, props.appointments]);


    async function postData() {
        const saveApp = async () => {
            try {
                await addAppointment(auth.token, parseInt(selectedSlot), selectedPet);
                setError(null);
                props.save();
            } catch (err) {
                setError(err.message);
            }
        }
        saveApp();
    }

    function handleSubmit(e) {
        e.preventDefault();
        postData();
    }

    return <>
        <Modal show={props.open} onHide={() => {props.close(); setError(null)}} centered>
            <Modal.Header closeButton className="border-bottom pb-3">
                <Modal.Title className="fw-semibold">Adaugă o programare</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 py-3">
                {error && error.split('\n').map(err => <p key={err.split(' ')[0]} className="text-danger mb-1"><small>{err}</small>
                </p>)}
                <Form id="add-appointment-form" onSubmit={handleSubmit}>
                    <Row className="g-3">
                        <Col xs={12} md={6}>
                            <Form.Group controlId="clinic">
                                <Form.Label className="fw-medium mb-1">Clinica</Form.Label>
                                <FormSelect name="clinic" value={selectedClinic}
                                            onChange={(e) => {
                                                setSelectedClinic(e.target.value);
                                                loadVetsByClinic(e.target.value);
                                            }} aria-label="Clinica" required>
                                    {clinics && clinics.length > 0 ? clinics.map(clinic => (
                                        <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                                    )) : <option disabled>Nu s-au găsit clinici</option>}
                                </FormSelect>
                            </Form.Group>
                        </Col>

                        <Col xs={12} md={6}>
                            <Form.Group controlId="vet">
                                <Form.Label className="fw-medium mb-1">Medic</Form.Label>
                                <FormSelect name="vet" aria-label="Medic" value={selectedVet}
                                            onChange={(e) => {
                                                setSelectedVet(e.target.value);
                                                loadSlotsByVet(e.target.value, selectedClinic);
                                            }} required>
                                    {vets && vets.length > 0 ? vets.map(vet => (
                                        <option key={vet.id} value={vet.id}>{vet.firstName} {vet.lastName} ({vet.username})</option>
                                    )) : <option disabled>Nu s-au găsit medici</option>}
                                </FormSelect>
                            </Form.Group>
                        </Col>

                        <Col xs={12} md={6}>
                            <Form.Group controlId="slot">
                                <Form.Label className="fw-medium mb-1">Slot</Form.Label>
                                <FormSelect name="slot" aria-label="Data" value={selectedSlot}
                                            onChange={(e) => setSelectedSlot(e.target.value)} required>
                                    {slots && slots.length > 0 ? slots.map(slot => (
                                        <option key={slot.id} value={slot.id}>{slot.slot}</option>
                                    )) : <option disabled >Nu s-au găsit locuri disponibile</option>}
                                </FormSelect>
                            </Form.Group>
                        </Col>

                        <Col xs={12} md={6}>
                            <Form.Group controlId="pet">
                                <Form.Label className="fw-medium mb-1">Animal de companie</Form.Label>
                                <FormSelect name="pet" aria-label="Animal de companie" value={selectedPet}
                                            onChange={(e) => setSelectedPet(e.target.value)} required>
                                    {pets && pets.length > 0 ? pets.map(pet => (
                                        <option key={pet.id} value={pet.id}>{pet.name}</option>
                                    )) : <option disabled>Nu s-au găsit animale de companie</option>}
                                </FormSelect>
                            </Form.Group>
                        </Col>

                        {/*<Col xs={12} md={6}>*/}
                        {/*    <Form.Group controlId="slot-start">*/}
                        {/*        <Form.Label className="fw-medium mb-1">Data start</Form.Label>*/}
                        {/*        <div>*/}
                        {/*            <DatePicker*/}
                        {/*                format="dd.MM.yyyy HH:mm"*/}
                        {/*                value={slot}*/}
                        {/*                onChange={setSlot}*/}
                        {/*                style={{width: '100%'}}*/}
                        {/*                container={() => document.body}*/}
                        {/*                oneTap={false}*/}
                        {/*            />*/}
                        {/*        </div>*/}
                        {/*    </Form.Group>*/}
                        {/*</Col>*/}
                        {/*<Col xs={12} md={6}>*/}
                        {/*    <Form.Group controlId="slots-number">*/}
                        {/*        <Form.Label className="fw-medium mb-1">Numar sloturi (durata interval = 30 min)</Form.Label>*/}
                        {/*        {*/}
                        {/*            <Form.Control name="slotsCount" type="number" min={1} max={20} defaultValue={1}/>*/}
                        {/*        }*/}
                        {/*    </Form.Group>*/}
                        {/*</Col>*/}
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-top pt-3">
                <Button variant="secondary" onClick={() => {props.close(); setError(null)}}>Închide</Button>
                <Button type="submit" variant="primary" form="add-appointment-form">Salvare</Button>
            </Modal.Footer>
        </Modal>
    </>
}