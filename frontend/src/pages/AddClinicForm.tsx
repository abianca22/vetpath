import {useContext, useEffect, useState} from "react";
import {Button, Form, Modal, Row, Col} from "react-bootstrap";
import {addClinic} from "../api/api.ts";
import {AuthContext} from "../api/authContext.ts";

export default function AddClinicForm(props) {
    const auth = useContext(AuthContext);
    const [error, setError] = useState(null);

    useEffect(() => {
    }, []);


    async function postData(formData) {
        const name = formData.get("name");
        const address = formData.get("address");
        const phone = formData.get("phone");
        const saveClinic = async () => {
            try {
                await addClinic(auth.token, {name: name, address: address, phoneNumber: phone});
                    setError(null);
                    props.save();
                } catch (err) {
                    setError(err.message);
                }
            }
            saveClinic();
    }

    function handleSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        postData(fd);
    }

    return <>
        <Modal show={props.open} onHide={() => {props.close(); setError(null)}} centered>
            <Modal.Header closeButton className="border-bottom pb-3">
                <Modal.Title className="fw-semibold">Adaugă o clinică</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 py-3">
                {error && error.split('\n').map(err => <p key={err.split(' ')[0]} className="text-danger mb-1"><small>{err}</small>
                </p>)}
                <Form id="add-clinic-form" onSubmit={handleSubmit}>
                    <Row className="g-3">
                        <Col xs={12} md={6}>
                            <Form.Group controlId="clinic-name">
                                <Form.Label className="fw-medium mb-1">Denumire</Form.Label>
                                <Form.Control name="name" type="text" />
                            </Form.Group>
                        </Col>

                        <Col xs={12} md={6}>
                            <Form.Group controlId="clinic-address">
                                <Form.Label className="fw-medium mb-1">Adresa</Form.Label>
                                <Form.Control name="address" type="text" />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="g-3 mt-2 justify-content-center">
                        <Col xs={12} md={6}>
                            <Form.Group controlId="clinic-phone">
                                <Form.Label className="fw-medium mb-1">Telefon</Form.Label>
                                <Form.Control name="phone" type="text" />
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-top pt-3">
                <Button variant="secondary" onClick={() => {props.close(); setError(null)}}>Închide</Button>
                <Button type="submit" variant="primary" form="add-clinic-form">Salvare</Button>
            </Modal.Footer>
        </Modal>
    </>
}