// import {Button, Form} from "react-bootstrap";
// import {AuthContext} from "../api/authContext.ts";
// import {useContext, useState} from "react";
// import {addPetType} from "../api/api.ts";
//
// export default function AddPetType() {
//     const auth = useContext(AuthContext);
//     const [error, setError] = useState(null);
//     const [enabled, setEnabled] = useState(false);
//
//     async function postData(formData) {
//         const name = formData.get("name");
//         const saveType = async () => {
//             try {
//                 await addPetType(auth.token, name);
//                 setError(null);
//                 setEnabled(false);
//             }
//             catch (err) {
//                 setError(err.message);
//             }
//         }
//         saveType();
//     }
//
//     return <>
//         {!enabled && <Button variant="primary" onClick={() => setEnabled(true)}>Adaugare</Button>}
//         {enabled &&
//         <Form id="add-type-form" action={postData}>
//             { error && <p className="text-danger"><small>{error}</small></p> }
//             <input type="text" name="name" placeholder="Denumire"/>
//             <Button type="submit">Salveaza</Button>
//         </Form>
//         }
//     </>
// }

import React, {useContext, useRef, useState} from "react";
import {Button, Form, Container, Row, Col} from "react-bootstrap";
import {AuthContext} from "../api/authContext.ts";
import {addPetType} from "../api/api.ts";

export default function AddPetType(props) {
    const auth = useContext(AuthContext);
    const [error, setError] = useState<string | null>(null);
    const [enabled, setEnabled] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") || "").trim();
        if (!name) {
            setError("Please provide a name.");
            return;
        }

        try {
            await addPetType(auth.token, name);
            setError(null);
            setEnabled(false);
            props.save();
            formRef.current?.reset();
        } catch (err) {
            setError(err?.message ?? "An error occurred.");
        }
    }

    return (
        <Container className="d-flex justify-content-center align-items-start" style={{minHeight: "0"}}>
            <Row className="w-100 justify-content-center">
                <Col xs={12} sm={10} md={8} lg={6}>
                            {!enabled ? (
                                <div className="d-flex justify-content-center">
                                    <Button variant="primary" onClick={() => setEnabled(true)}>Adaugare</Button>
                                </div>
                            ) : (
                                <Form ref={formRef} id="add-type-form" onSubmit={handleSubmit}>
                                    {error && <p className="text-danger"><small>{error}</small></p>}
                                    <Form.Group controlId="petTypeName" className="mb-3">
                                        <Form.Label className="visually-hidden">Denumire</Form.Label>
                                        <Form.Control name="name" type="text" placeholder="Type name" />
                                    </Form.Group>

                                    <div className="d-flex justify-content-between gap-2">
                                        <Button variant="secondary" onClick={() => { setEnabled(false); setError(null); formRef.current?.reset(); }}>
                                            Anulare
                                        </Button>
                                        <Button type="submit" variant="primary">
                                            Salvare
                                        </Button>
                                    </div>
                                </Form>
                            )}
                </Col>
            </Row>
        </Container>
    );
}
