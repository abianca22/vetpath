import {AuthContext} from "../api/authContext.ts";
import {useContext, useEffect, useState} from "react";
import {filterPets, getAllBreeds, getAllTypes, getBreedsByType} from "../api/api.ts";
import {
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Spinner
} from "react-bootstrap";

export default function Pets() {
    const auth = useContext(AuthContext);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [types, setTypes] = useState([]);
    const [breeds, setBreeds] = useState([]);
    const [error, setError] = useState(null);
    const [lastOwnerString, setLastOwnerString] = useState("");
    const [lastNameString, setLastNameString] = useState("");
    const [lastType, setLastType] = useState("");
    const [lastBreed, setLastBreed] = useState("");

    async function fetchBreedsByType(typeId) {
        try {
            const res = await getBreedsByType(typeId);
            setBreeds(res);
            setError(null);
        } catch (err) {
            setError(err.message);
            setBreeds([]);
        }
    }

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const res = await getAllTypes();
                setTypes(res);
                setError(null);
            }
            catch (err) {
                setError(err.message);
            }
        }
        fetchTypes();
        const fetchBreeds = async () => {
            try {
                const res = await getAllBreeds();
                setBreeds(res);
                setError(null);
            } catch (err) {
                setError(err.message);
            }
        }
        fetchBreeds();


        const fetchPets = async () => {
            try {
                setLoading(true);
                const res = await filterPets(auth.token, null, null, null, null);
                setPets(res);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        }
        fetchPets();
    }, []);

    async function handleSearch(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        let owner = formData.get("owner");
        setLastOwnerString(owner.toString());
        let name = formData.get("name");
        setLastNameString(name.toString());
        let typeId = formData.get("type");
        setLastType(typeId.toString());
        let breedId = formData.get("breed");
        setLastBreed(breedId.toString());

        if (owner === '' || owner === undefined) {
            owner = null;
        }
        if (name === '' || name === undefined) {
            name = null;
        }
        if (breedId === '' || breedId === undefined) {
            breedId = null;
        }
        if (typeId === '' || typeId === undefined) {
            typeId = null;
        }

        try {
            setLoading(true);
            const res = await filterPets(auth.token, owner, name, typeId, breedId);
            setPets(res);
            setLoading(false);
        }
        catch(err) {
            setLoading(false);
            setPets([]);
            setError(err);
        }
    }

    return <>
        <Container className="mt-5">
        {loading ? (
            <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Se incarca...</span>
                </Spinner>
            </div>
        ) : (
            <>
                {error && <p className="text-danger">{error}</p>}
                <Form className="d-flex justify-content-start mb-5" onSubmit={handleSearch}>
                    <Form.Group className="m-2">
                        <Form.Label>Utilizator</Form.Label>
                        <br/>
                        <Form.Control name="owner" type="text" value={lastOwnerString} onChange={(e) => setLastOwnerString(e.target.value)}></Form.Control>
                    </Form.Group>
                    <Form.Group className="m-2">
                        <Form.Label>Animal</Form.Label>
                        <br/>
                        <Form.Control name="name" type="text" value={lastNameString} onChange={(e) => setLastNameString(e.target.value)}></Form.Control>
                    </Form.Group>
                    <Form.Group className="m-2">
                        <Form.Label>Specie</Form.Label>
                        <br/>
                        <Form.Select name="type" value={lastType} onChange={(e) => {
                            const selectedTypeId = e.target.value;
                            e.persist();
                            setLastType(selectedTypeId);
                            fetchBreedsByType(selectedTypeId);
                        }}>
                            <option value="" hidden={true}></option>
                            {
                                types && types.length > 0 ? (types.map(type =>
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                )) :
                                    <option disabled>Niciun rezultat</option>
                            }
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="m-2">
                        <Form.Label>Rasa</Form.Label>
                        <br/>
                        <Form.Select name="breed" value={lastBreed} onChange={(e) => setLastBreed(e.target.value)}>
                            <option value="" hidden={true}></option>
                            {breeds && breeds.length > 0 ?
                                breeds.map(breed => <option key={breed.id} value={breed.id}>{breed.name}</option>) :
                                <option disabled>Niciun rezultat</option>
                            }
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="m-2 d-flex align-items-end">
                        <Button type="submit" variant="primary" className="mx-2">Cautare</Button>
                        <Button type="button" variant="secondary" onClick={() => {
                            setLastNameString("");
                            setLastOwnerString("");
                            setLastBreed("");
                            setLastType("");
                        }}>Resetare</Button>
                        <Button type="button" variant="success" className="mx-2" href={`/pets/${auth.user.username}`}>Animalele mele</Button>
                    </Form.Group>
                </Form>
                {pets && pets.length > 0 ? (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {pets.map(pet => (
                            <Col key={pet.id}>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body className="d-flex flex-column">
                                        <div className="d-flex align-items-start mb-3">
                                            <div>
                                                <Card.Title className="mb-1">{pet.name}</Card.Title>
                                                {pet.breed?.petType?.name && (
                                                    <Badge bg="secondary"
                                                           className="me-1">{pet.breed.petType.name}</Badge>
                                                )}
                                                {pet.breed?.name && <div
                                                    className="text-muted small mt-1">Rasa: {pet.breed.name}</div>}
                                            </div>
                                        </div>

                                        <div className="mt-auto d-flex justify-content-between align-items-center">
                                            <div className="text-muted small">ID: {pet.id}</div>
                                            <Button variant="success" size="sm" href={`/pets/${pet.owner.username}/${pet.name}`}>Detalii</Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div className="text-center py-5">
                        <div style={{fontSize: 48}}>🐾</div>
                        <p className="text-muted">Nu au fost gasite animale de companie</p>
                    </div>
                )}
            </>
        )}
        </Container>
    </>
}