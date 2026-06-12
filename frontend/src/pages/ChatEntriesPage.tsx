import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {useNavigate, useParams} from "react-router-dom";
import {Button, Col, Container, Form, Row, Table} from "react-bootstrap";
import {fetchChatEntries, findPetByOwnerAndName} from "../api/api.ts";

export default function ChatEntries(){
    const auth = useContext(AuthContext);
    const params = useParams();
    const [entries, setEntries] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [selectedPet, setSelectedPet] = useState("");
    const [pets, setPets] = useState([]);
    const [lastKeyword, setLastKeyword] = useState("");

    useEffect(() => {
        const fetchEntries = async() => {
            try {
                const res = await fetchChatEntries(auth.token, params.username, null, null);
                console.log(res);
                setEntries(res)
                setError(null);
            }
            catch (err) {
                setError(err);
                navigate("/access-denied");
            }
        }
        fetchEntries();

        const fetchPets = async() => {
            try {
                const res = await findPetByOwnerAndName(auth.token, params.username);
                setPets(res);
            }
            catch (err) {
                setError(err);
            }
        }
        fetchPets();
    }, [params.username]);

    async function handleSearch(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        let petId = formData.get("pet");
        setSelectedPet(petId.toString());
        let keyword = formData.get("keyword");
        setLastKeyword(keyword.toString());
        console.log(petId.toString());
        if (petId === '') {
            petId = null;
        }
        if(keyword === '') {
            keyword = null;
        }
        try {
            const res = await fetchChatEntries(auth.token, params.username, petId, keyword);
            setEntries(res);
        }
        catch (err) {
            setError(err);
        }
    }

    return <Container className="d-flex flex-grow-1" fluid>
        <Row className="align-items-start h-100 w-100 justify-content-center">
            <Col className="col-9">
                <h1 className="m-5 text-center">Istoric intrebari</h1>
                { error && <p className="alert-danger">{error}</p> }
                    <Form className="d-flex justify-content-start" id="search-by-pet-form" onSubmit={handleSearch}>
                        <Form.Group className="m-2">
                            <Form.Label>Animal de companie</Form.Label>
                            <Form.Select name="pet" value={selectedPet} onChange={(e) => setSelectedPet(e.target.value)}>
                                {pets && pets.length > 0 && <>
                                <option value="">Toate animalele</option>
                                {
                                    pets.map(pet =>
                                        <option key={pet.id} value={pet.id}>{pet.name}</option>
                                    )
                                }
                                </>
                                }
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="m-2">
                            <Form.Label>Text</Form.Label>
                            <Form.Control name="keyword" value={lastKeyword} onChange={(e) => setLastKeyword(e.target.value)}></Form.Control>
                        </Form.Group>
                        <Form.Group className="m-2 d-flex align-items-end">
                            <Button variant="primary" type="submit" form="search-by-pet-form" className="mx-2">Cautare</Button>
                            <Button variant="secondary" type="button" onClick={() => {
                                setSelectedPet("");
                                setLastKeyword("");
                            }}>Resetare</Button>
                        </Form.Group>
                    </Form>
                    <div className="d-flex justify-content-end">
                    <Button variant="secondary" href="/ask">Puneti o intrebare</Button>
                    </div>
                <div className="table-responsive text-center">
                    <Table className="mt-5">
                        <thead>
                        <tr>
                            <th>Data</th>
                            <th>Animal de companie</th>
                            <th>Intrebare</th>
                            <th>Raspuns</th>
                            <th>Actiuni</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            entries && entries.length > 0 ? entries.map(entry => (
                                <tr key={entry.id}>
                                    <td>{entry.timestamp}</td>
                                    <td>{entry.pet.name}</td>
                                    <td>{entry.userMessage.split(" ").slice(0, 5).join(" ")}{entry.userMessage.split(" ").length > 5 ? ' [...]' : ''}</td>
                                    <td>{entry.botResponse.split(" ").slice(0, 5).join(" ")}{entry.botResponse.split(" ").length > 5 ? ' [...]' : ''}</td>
                                    <td className="d-flex">
                                        <Button variant="success" onClick={() => {
                                            sessionStorage.setItem("questionId", entry.id.toString());
                                            navigate(`/ask/history/${params.username}/details`);
                                        }}>Detalii</Button>
                                    </td>
                                </tr>
                            )) : <tr>
                                <td colSpan={5}>Nu exista rezultate</td>
                            </tr>
                        }
                        </tbody>
                    </Table>
                </div>
            </Col>
        </Row>
    </Container>

}