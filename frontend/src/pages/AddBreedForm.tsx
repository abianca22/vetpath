// import {useContext, useEffect, useState} from "react";
// import {AuthContext} from "../api/authContext.ts";
// import {addBreed, getAllTypes} from "../api/api.ts";
// import {Button, Form, FormSelect} from "react-bootstrap";
//
// export default function AddBreed() {
//     const auth = useContext(AuthContext);
//     const [error, setError] = useState(null);
//     const [enabled, setEnabled] = useState(false);
//     const [types, setTypes] = useState(null);
//
//     useEffect(() => {
//             const fetchTypes = async () => {
//                 const res = await getAllTypes();
//                 setTypes(res);
//             }
//             fetchTypes();
//     }, []);
//
//     async function postData(formData) {
//             const typeName = formData.get("type");
//             const breedName = formData.get("breedName");
//             const saveBreed = async () => {
//                 try {
//                     await addBreed(auth.token, breedName, typeName);
//                     setError(null);
//                     setEnabled(false);
//                 } catch (err) {
//                     setError(err.message);
//                 }
//             }
//             saveBreed();
//     }
//
//     return <>
//     {error && <p className="text-danger"><small>{error}</small></p>}
//             {!enabled && <Button onClick={() => setEnabled(true)} variant="primary">Adaugare</Button>}
//             {enabled &&
//                 <Form action={postData} id="add-breed-form">
//                     <input placeholder="Denumire" name="breedName" type="text"/>
//                     <FormSelect name="type" defaultValue={(types && types.length > 0) ? types[0].id: ''}>
//                         {types && types.length > 0 ? types.map(type => (
//                             <option key={type.id} value={type.id}>{type.name}</option>
//                         )) : <option disabled>Nu s-au gasit tipuri de animale de companie</option>}
//                     </FormSelect>
//                     <Button type="submit">Salvare</Button>
//                 </Form>
//             }
//     </>
// }

import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import { addBreed, getAllTypes } from "../api/api.ts";
import { Button, Form, Container, Row, Col, FormSelect, Spinner, Alert } from "react-bootstrap";

type PetType = { id: number | string; name: string };

export default function AddBreed(props) {
    const auth = useContext(AuthContext);
    const [types, setTypes] = useState<PetType[] | null>(null);
    const [enabled, setEnabled] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);
    const [currentType, setCurrentType] = useState(null);

    useEffect(() => {
        const fetchTypes = async () => {
            setLoading(true);
            try {
                const res = await getAllTypes();
                setTypes(Array.isArray(res) ? res : []);
                    if (props.type) {
                        const matchedType = (Array.isArray(res) ? res : []).find(t => t.id.toString() === props.type);
                        if (matchedType) {
                            setCurrentType(matchedType.id);
                        } else {
                            setError(`Type "${props.type}" not found.`);
                        }
                    }
            } catch (err) {
                setError(err?.message ?? "Failed to load types.");
            } finally {
                setLoading(false);
            }
        };
        fetchTypes();
    }, [props.type]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const breedName = String(fd.get("breedName") || "").trim();
        const typeId = fd.get("type");
        if (!breedName || !typeId) {
            setError("Please provide a breed name and select a type.");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await addBreed(auth.token, breedName, typeId);
            setEnabled(false);
            formRef.current?.reset();
            props.showToast();
            props.save?.();
        } catch (err) {
            setError(err?.message ?? "An error occurred.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Container className="d-flex justify-content-center align-items-start" style={{ minHeight: 0 }}>
            <Row className="w-100 justify-content-center">
                <Col xs={12} sm={10} md={8} lg={6}>
                     {error && <Alert variant="danger" className="py-1">{error}</Alert>}

                            {loading ? (
                                <div className="d-flex justify-content-center py-3">
                                    <Spinner animation="border" />
                                </div>
                            ) : !enabled ? (
                                <div className="d-flex justify-content-center">
                                    <Button variant="primary" onClick={() => setEnabled(true)}>Adaugare</Button>
                                </div>
                            ) : (
                                <Form ref={formRef} onSubmit={handleSubmit} id="add-breed-form">
                                    <Form.Group controlId="breedName" className="mb-2">
                                        <Form.Label className="visually-hidden">Denumire rasa</Form.Label>
                                        <Form.Control name="breedName" type="text" placeholder="Breed name" />
                                    </Form.Group>

                                    <Form.Group controlId="breedType" className="mb-3">
                                        <Form.Label className="visually-hidden">Type</Form.Label>
                                        <FormSelect name="type" defaultValue={currentType ? currentType : ((types && types.length > 0) ? String(types[0].id) : "")}>
                                            {types && types.length > 0 ? (
                                                types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                                            ) : (
                                                <option disabled>No types available</option>
                                            )}
                                        </FormSelect>
                                    </Form.Group>

                                    <div className="d-flex justify-content-between gap-2">
                                        <Button variant="secondary" onClick={() => { setEnabled(false); setError(null); formRef.current?.reset(); }} disabled={submitting}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" variant="primary" disabled={submitting}>
                                            {submitting ? <Spinner as="span" animation="border" size="sm" /> : "Save"}
                                        </Button>
                                    </div>
                                </Form>
                            )}
                </Col>
            </Row>
        </Container>
    );
}
