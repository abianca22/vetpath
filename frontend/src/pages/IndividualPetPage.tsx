import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {
    deletePet,
    editPet,
    findPetByOwnerAndName,
    findUserByUsername,
    getAllBreeds,
    getAllTypes,
    getBreedsByType
} from "../api/api.ts";
import {Container, Row, Col, Card, Button, Form, FormSelect} from "react-bootstrap";
import {useNavigate, useParams} from "react-router-dom";
import type {PetDTO} from "../types.ts";
import Confirm from "../components/Confirm.tsx";
import {isAdmin} from "../api/roles.ts";
import {DatePicker} from "rsuite";
import {format} from "date-fns";

export default function IndividualPet() {
    const auth = useContext(AuthContext);
    const [error, setError] = useState<string | null>(null);
    const [pet, setPet] = useState<PetDTO | null>(null);
    const params = useParams();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const navigate = useNavigate();
    const [isActive, setIsActive] = useState(false);
    const [types, setTypes] = useState(null);
    const [breeds, setBreeds] = useState(null);
    const [dob, setDob] = useState(null);

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

    async function postData(formData) {
        const name = formData.get("name");
        const breedId = parseInt(formData.get("breed"));
        const petDob = dob ? format(dob, 'dd.MM.yyyy') : null;
        const petDobArr = petDob ? petDob.split('.').map(num => parseInt(num)) : null;
        const date = petDobArr ? new Date(petDobArr[2], petDobArr[1] - 1, petDobArr[0]) : null;
        if (date === null || isNaN(date.getTime())) {
            setError("Data nașterii nu este validă. Asigurați-vă că ați selectat o dată. Dacă nu cunoașteți data exactă, alegeți una aproximativă.");
            return;
        }
        if (date > new Date()) {
            setError("Data nașterii nu poate fi în viitor.");
            return;
        }
        if (pet) {
            const savePet = async () => {
                try {
                    await editPet(auth.token, {id: pet.id, name: name, breed: {id: breedId}, birthDate: petDob});
                    setError(null);
                }
                catch (err) {
                    setError(err.message);
                }
            }
            savePet();
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        postData(fd);
        setIsActive(false);
        navigate(`/pets/${params.username}/${fd.get("name")}`);
    }


    useEffect(() => {
        const fetchPet = async () => {
            try {
                const user = await findUserByUsername(auth.token, params.username);
                console.log(user);
                const pets = await findPetByOwnerAndName(auth.token, params.username, params.petName);
                const pet = pets.filter(p => p.name === params.petName)[0];
                setPet(pet);
                setError(null);
                console.log(await findPetByOwnerAndName(auth.token, params.username));
            } catch (err) {
                setError(err.message);
            }
        }
        fetchPet();
        const fetchTypes = async () => {
            try {
                const res = await getAllTypes();
                setTypes(res);
                setError(null);
                await fetchBreedsByType(res[0].id);
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
        const fetchBD = async () => {
            if (pet && pet.birthDate) {
                setDob(new Date(parseInt(pet.birthDate.split('.')[2]), parseInt(pet.birthDate.split('.')[1]) - 1, parseInt(pet.birthDate.split('.')[0])));
            }
        }
        fetchBD();
    }, [params.username, params.petName, pet && pet.birthDate]);

    async function handleDelete() {
        try {
            await deletePet(auth.token, pet.id);
            navigate(`/pets/${auth.user.username}`);
        }
        catch (err) {
            console.log(err);
        }
    }

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
    }

    return <>
        {error && <p className="text-danger">{error}</p>}
        <Container className="d-flex justify-content-center align-items-start" style={{paddingTop: '2.5rem'}}>
            <Row className="w-100 justify-content-center">
                <Col xs={12} md={8} lg={6}>
                    { error && <p className="text-danger text-center"><small>{error}</small></p> }

                    { pet ? (
                        <Card className="shadow-sm p-5">
                            <Card.Body>
                                <Form id="edit-pet-form" onSubmit={handleSubmit}>
                                <div className="d-flex flex-column align-items-center">
                                    <Form.Group controlId="pet-name">
                                        {isActive && <Form.Label className="fw-bold mb-1 mx-2">Nume</Form.Label>}
                                        <Form.Control defaultValue={pet.name} name="name" type="text" disabled={!isActive} className={!isActive ? 'disabled-styling' : ''}/>
                                    </Form.Group>
                                    <small className="text-muted">Proprietar: {params.username}</small>
                                </div>

                                <hr />

                                <Row className="gx-3 gy-2">
                                    <Col xs={6} className="fw-bold d-flex align-items-center">Specie</Col>
                                    <Col xs={6}>
                                        <Form.Group controlId="pet-type">
                                            <FormSelect name="type" defaultValue={pet.breed?.petType?.id} onChange={(e) => {
                                                const selectedTypeId = e.target.value;
                                                e.persist();
                                                fetchBreedsByType(selectedTypeId);
                                            }} disabled={!isActive} className={!isActive ? 'disabled-styling' : ''}>
                                                {types && types.length > 0 ? types.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name}</option>
                                                )) : <option disabled>Nu s-au găsit tipuri</option>}
                                            </FormSelect>
                                        </Form.Group>
                                        </Col>

                                    <Col xs={6} className="fw-bold d-flex align-items-center">Rasă</Col>
                                    <Col xs={6}>
                                        <Form.Group controlId="pet-breed">
                                            <FormSelect name="breed" defaultValue={pet.breed ? pet.breed.id : ''} disabled={!isActive}>
                                                {breeds && breeds.length > 0 ? breeds.map(breed => (
                                                    <option key={breed.id} value={breed.id}>{breed.name}</option>
                                                )) : <option disabled>Nu s-au găsit rase</option>}
                                            </FormSelect>
                                        </Form.Group>
                                    </Col>

                                    <Col xs={6} className="fw-bold d-flex align-items-center">Data nașterii</Col>
                                    <Col xs={6}><Form.Group controlId="pet-dob">
                                        <div>
                                            <DatePicker disabled={!isActive} className="custom-picker"
                                                format="dd.MM.yyyy"
                                                value={dob}
                                                onChange={setDob}
                                                style={{width: '100%'}}
                                                container={() => document.body}
                                                oneTap={false}
                                            />
                                        </div>
                                    </Form.Group>
                                    </Col>
                                </Row>

                                <hr />
                                </Form>
                            </Card.Body>

                            <Card.Footer>
                                {(pet.owner.id === auth.user.id || isAdmin(auth.user.roles)) && (
                                    <div className="d-flex justify-content-between gap-2">
                                        {!isActive && <Button variant="primary" onClick={() => setIsActive(true)}>Editare</Button>}
                                        {isActive && (
                                            <Button variant="primary" form="edit-pet-form" type="submit">Salvare</Button>
                                        )}
                                        {!isActive &&
                                        <Button variant="danger" onClick={() => {
                                            setShowDeleteConfirm(true);
                                        }}>Stergere</Button>
                                        }
                                    </div>
                                )}
                            </Card.Footer>
                        </Card>
                    ) : (
                        <p className="py-3 text-center">Se încarcă...</p>
                    ) }
                </Col>
            </Row>
        </Container>
        <Confirm open={showDeleteConfirm} close={closeDeleteConfirm} confirm={handleDelete} message="Doriti sa stergeti acest animal de companie?"/>

    </>
 }
