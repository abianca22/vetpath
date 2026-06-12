import {AuthContext} from "../api/authContext.ts";
import {useContext, useEffect, useState} from "react";
import {Button, Card, Col, Container, Form, FormSelect, Row} from "react-bootstrap";
import {findPetByOwnerAndName, sendQuestion} from "../api/api.ts";
import React from "react";

export default function Chat() {
    const auth = useContext(AuthContext);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedPet, setSelectedPet] = useState("");
    const [pets, setPets] = useState([]);

    useEffect(() => {
        const fetchPets = async () => {
            try {
                const res = await findPetByOwnerAndName(auth.token, auth.user.username);
                setPets(res);
                setSelectedPet(res.length > 0 ? res[0].id.toString(): '');
                setError(null);
            }
            catch(err) {
                setError(err);
                console.error(err);
                setPets([]);
            }
        }
        fetchPets();

    }, [question]);

    async function handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const question = formData.get("question") as string;
        console.log("User's question:", question);
        setQuestion(question);
        try {
            setLoading(true);
            const res = await sendQuestion(auth.token, question, selectedPet);
            setAnswer(res)
            setError(null);
            setLoading(false);
            console.log(selectedPet);
        }
        catch (err) {
            setLoading(false);
            setError(err);
        }
    }

    return <>
        <Container className="d-flex d-flex flex-grow-1">
            <Row className="align-items-start h-100 w-100 justify-content-center">
                <Col xs={9}>
                    <article className="m-5">
                        <h2 className="text-center">Simptome inițiale</h2>
                        <Form id="chat-ask-form" onSubmit={handleSubmit} className="mt-5">
                            <Form.Group controlId="pet">
                                <Form.Label className="fw-medium mb-1">Animal de companie</Form.Label>
                                <FormSelect name="pet" aria-label="Animal de companie" value={selectedPet}
                                            onChange={(e) => setSelectedPet(e.target.value)} required>
                                    {pets && pets.length > 0 ? pets.map(pet => (
                                        <option key={pet.id} value={pet.id}>{pet.name}</option>
                                    )) : <option disabled>Nu s-au găsit animale de companie</option>}
                                </FormSelect>
                            </Form.Group>
                            <Form.Group className="mt-3">
                                <Form.Label>Introduceți mai jos simptomele pe care le-ați observat:</Form.Label>
                                <Form.Control type="text" as="textarea" rows={2} name="question"required></Form.Control>
                            </Form.Group>
                            <Form.Group className="d-flex justify-content-between mt-2">
                                <Button variant="primary" type="button" disabled={loading} href={`/ask/history/${auth.user.username}`}>Istoric intrebari</Button>
                                <Button variant="secondary" type="submit" className="text-end" disabled={loading}>Trimitere</Button>
                            </Form.Group>
                        </Form>
                    </article>
                    {
                        question !== "" && answer !== "" && !loading &&
                        <>
                            <Card className="p-1">
                                <Card.Body style={{fontSize: "1.2em"}}>
                                    <Card.Text>
                                        {
                                            answer.split('\n').map((row, index) =>
                                                <React.Fragment key={index}>
                                                        {
                                                            row.split('**')
                                                                .map((sentence, ind) => {
                                                                    if (index % 2 === 1) {
                                                                        return <b key={ind}>{sentence}</b>;
                                                                    }
                                                                    return <span key={ind}>{sentence}</span>;
                                                                })
                                                        }
                                                        <br/>
                                                    </React.Fragment>
                                            )
                                        }
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </>

                    }
                    {
                            loading && <div className="alert alert-info" role="alert">
                                Se procesează întrebarea...
                            </div>
                    }
                    {
                        error && <div className="alert alert-danger" role="alert">
                            {error.message || "A apărut o eroare la trimiterea întrebării."}
                        </div>
                    }
                </Col>
            </Row>
        </Container>
    </>
}