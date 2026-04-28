import {useContext, useEffect, useState} from "react";
import {Button, Form, Modal, Row, Col, FormControl} from "react-bootstrap";

import {AuthContext} from "../api/authContext.ts";
import {cancelAppointment} from "../api/api.ts";
import {FormControlLabel, Switch} from "@mui/material";

export default function CancelAppointmentForm(props) {
    const auth = useContext(AuthContext);
    const [error, setError] = useState(null);
    const [checked, setChecked] = useState(true);

    function handleChange() {
        setChecked(!checked);
    }

    useEffect(() => {
    }, [auth.token]);



    async function postData(formData) {
        const cancelReason = formData.get("reason");
        if (!props.slot) return;
        try {
            await cancelAppointment(auth.token, auth.user, props.slot.id,auth.user.id === props.slot.vet.id ? checked : true, cancelReason);
            setError(null);
            props.save();
        }
        catch(err) {
            setError(err);
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        postData(fd);
    }

    return <>
        <Modal show={props.open} onHide={() => {props.close(); setError(null)}} centered>
            <Modal.Header closeButton className="border-bottom pb-3">
                <Modal.Title className="fw-semibold">Anulare programare</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 py-3">
                {error && error.split('\n').map(err => <p key={err.split(' ')[0]} className="text-danger mb-1"><small>{err}</small>
                </p>)}
                <Form id="cancel-appointment-form" onSubmit={handleSubmit}>
                    <Row className="g-3">
                        <Col xs={12} md={6}>
                            <Form.Group controlId="reason">
                                <Form.Label className="fw-medium mb-1">Motivul anularii</Form.Label>
                                <FormControl name="reason" type="text" aria-label="Reason"/>
                            </Form.Group>
                        </Col>
                        {
                            (props.slot && props.slot.vet.id === auth.user.id) && (
                                <Col xs={12} md={6}>
                                    <Form.Group controlId="recreate-slot">
                                        <FormControlLabel control={<Switch defaultChecked checked={checked} onChange={handleChange}/>} label={checked ? "Doresc eliberarea intervalului" : "Doresc eliminarea intervalului"}></FormControlLabel>
                                    </Form.Group>
                                </Col>
                            )
                        }
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-top pt-3">
                <Button variant="secondary" onClick={() => {props.close(); setError(null)}}>Renuntare</Button>
                <Button type="submit" variant="primary" form="cancel-appointment-form">Stergere</Button>
            </Modal.Footer>
        </Modal>
    </>
}