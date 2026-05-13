import {useContext, useEffect, useState} from "react";
import {Button, Form, Modal, Row, Col} from "react-bootstrap";
import {addRecord} from "../api/api.ts";
import {AuthContext} from "../api/authContext.ts";
import moment from "moment";

export default function MedicalRecordForm(props) {
    const auth = useContext(AuthContext);
    const [error, setError] = useState(null);

    function getAge() {
        const dob = moment(`${props.appointment?.pet?.birthDate.split('.').reverse().join('-')}`);
        if (moment().diff(dob, 'years') <= 1) {
            if (moment().diff(dob, 'month') <= 1) {
                return "1 lună";
            }
            else {
                return `${moment().diff(dob, 'month')} luni`;
            }
        }
        else {
            return `${moment().diff(dob, 'years')} ani`;
        }
    }

    useEffect(() => {
    }, [props.appointment]);


    async function postData(formData) {
        const symptoms = formData.get("symptoms");
        const diagnosis = formData.get("diagnosis");
        const treatment = formData.get("treatment");
        const recordData = {
            vet: {
                id: auth.user.id
            },
            pet: {
                id: props.appointment.pet.id
            },
            appointment: {
                id: props.appointment.id
            },
            symptoms: symptoms,
            diagnosis: diagnosis,
            treatment: treatment
        };
        const saveRecord = async () => {
            try {
                    console.log(recordData);
                    await addRecord(auth.token, recordData);
                    setError(null);
                    props.save();
            }
            catch (err) {
                    setError(err.message);
                }
        }
        saveRecord();
    }

    function handleSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        postData(fd);
    }

    return <>
        <Modal show={props.open} onHide={() => {props.close(); setError(null)}} centered>
            <Modal.Header closeButton className="border-bottom pb-3">
                <Modal.Title className="fw-semibold">Raport Medical</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 py-3">
                {error && error.split('\n').map(err => <p key={err.split(' ')[0]} className="text-danger mb-1"><small>{err}</small>
                </p>)}
                <Row className="mt-3">
                    <Col>
                        <b>Animal de companie:</b>
                    </Col>
                    <Col>
                        {props.appointment?.pet?.name} (Vârstă: <b>{getAge()}</b>)
                    </Col>
                </Row>
                <Row className="mt-3 mb-3">
                    <Col>
                        <b>Medic veterinar:</b>
                    </Col>
                    <Col>
                        {props.appointment?.vet?.username} (Clinică: <b>{props.appointment?.clinic?.name}</b>)
                    </Col>
                </Row>
                <Form id="add-pet-form" onSubmit={handleSubmit}>
                    <Row className="g-3">
                        <Col xs={12} md={12}>
                            <Form.Group controlId="symptoms">
                                <Form.Label className="fw-medium mb-1">Simptome</Form.Label>
                                        <Form.Control name="symptoms" type="text" as="textarea" rows={3}/>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={12}>
                            <Form.Group controlId="diagnosis">
                                <Form.Label className="fw-medium mb-1">Diagnostic</Form.Label>
                                <Form.Control name="diagnosis" type="text" as="textarea" rows={3}/>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={12}>
                            <Form.Group controlId="treatment">
                                <Form.Label className="fw-medium mb-1">Tratament/Recomandări</Form.Label>
                                <Form.Control name="treatment" type="text" as="textarea" rows={3}/>
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-top pt-3">
                <Button variant="secondary" onClick={() => {props.close(); setError(null)}}>Închide</Button>
                <Button type="submit" variant="primary" form="add-pet-form">Salvare</Button>
            </Modal.Footer>
        </Modal>
    </>
}