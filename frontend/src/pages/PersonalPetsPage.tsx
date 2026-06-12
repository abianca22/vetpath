import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {findPetByOwnerAndName, findUserByUsername, getAllBreeds, getAllTypes, getBreedsByType} from "../api/api.ts";
import {useNavigate, useParams} from "react-router-dom";
import {Button, Card, Col, Container, Row, Spinner, Badge, Image, Form} from "react-bootstrap";
import AddPetForm from "./AddPetForm.tsx";
import type {PetDTO, RoleDTO, UserDTO} from "../types.ts";
import {isPetOwner} from "../api/roles.ts";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";

type PetWithPhoto = PetDTO & { photoUrl?: string };

export default function PersonalPets() {
    const auth = useContext(AuthContext);
    const [pets, setPets] = useState<PetWithPhoto[] | null>(null);
    const params = useParams();
    const [owner, setOwner] = useState<UserDTO | {id?: string, username?: string, profileUrl?: string, roles?: RoleDTO[]}>({username: params.username});
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [closeCount, setCloseCount] = useState(0);
    const navigate = useNavigate();
    const [lastBreed, setLastBreed] = useState("");
    const [lastType, setLastType] = useState("");
    const [lastNameString, setLastNameString] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [error, setError] = useState(null);
    const [types, setTypes] = useState([]);
    const [breeds, setBreeds] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");


    const openAddModal = () => {
        setShowAddModal(true);
    }
    const closeAddModalWithCount = () => {
        setShowAddModal(false);
        setCloseCount(prev => prev + 1);
    }
    const closeAddModalNoCount = () => {
        setShowAddModal(false);
    }

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

    const fetchPets = async () => {
        try {
            setLoading(true);
            const ownerRes = await findUserByUsername(auth.token, params.username);
            setOwner(ownerRes);
            setIsOwner(auth.user.id === ownerRes.id);
            const res = await findPetByOwnerAndName(auth.token, params.username);
            setPets(res);
            if(auth.user.id !== ownerRes.id && isPetOwner(auth.user.roles)) {
                navigate('/access-denied');
                return;
            }
        }
        catch (err) {
            setLoading(false);
            setError(err);
            setPets([]);
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const checkPetDeletion = async () => {
            if(sessionStorage.getItem("deletedPetId") !== null) {
                setSuccessMessage("Datele au fost sterse cu succes");
                setShowSuccess(true);
                sessionStorage.removeItem("deletedPetId");
            }
        }
        checkPetDeletion();
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
        const fetchBreeds = async () => {
            try {
                const res = await getAllBreeds();
                setBreeds(res);
                setError(null);
            } catch (err) {
                setError(err.message);
            }
        }
        fetchTypes();
        fetchBreeds();
        fetchPets();
    }, [params.username, closeCount]);


    async function handleSearch(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        let name = formData.get("name");
        setLastNameString(name.toString());
        let typeId = formData.get("type");
        setLastType(typeId.toString());
        let breedId = formData.get("breed");
        setLastBreed(breedId.toString());

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
            let res = await findPetByOwnerAndName(auth.token, params.username, name);
            if (typeId !== null) {
                res = res.filter(pet => pet.breed.petType.id.toString() === typeId.toString());
            }
            if (breedId !== null) {
                res = res.filter(pet => pet.breed.id.toString() === breedId.toString());
            }
            setPets(res);
            setLoading(false);
        }
        catch(err) {
            setLoading(false);
            setPets([]);
            setError(err);
        }
    }

    return (
        <>
        { !(!isOwner && isPetOwner(auth.user.roles)) &&
        <Container className="py-4">
            {error && <div className="alert alert-danger">{error.message}</div>}
            <Form className="d-flex justify-content-start mb-5" onSubmit={handleSearch}>
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
                        setLastBreed("");
                        setLastType("");
                    }}>Resetare</Button>
                </Form.Group>
            </Form>
            <Row className="align-items-center mb-4">
                {isOwner && <h3 className="text-center mt-3 mb-3">Animalele mele</h3>}
                {
                    !isOwner &&
                    <Col>
                        <h2 className="mb-0">{owner?.username}</h2>
                        <div className="text-muted">Animale de companie</div>
                    </Col>
                }
                <Col>
                    {isOwner && (
                        <div className="d-flex justify-content-center">
                        <Button variant="primary" onClick={openAddModal}>Adauga un animal</Button>
                        </div>
                    )}
                </Col>
            </Row>

            {loading ? (
                <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Se incarca...</span>
                    </Spinner>
                </div>
            ) : (
                <>
                    {pets && pets.length > 0 ? (
                        <Row xs={1} md={2} lg={3} className="g-4">
                            {pets.map(pet => (
                                <Col key={pet.id}>
                                    <Card className="h-100 shadow-sm">
                                        <Card.Body className="d-flex flex-column">
                                            <div className="d-flex align-items-start mb-3">
                                                <Image src={pet.photoUrl || `https://icons8.com/icon/122635/no-image`}
                                                       rounded style={{width: 80, height: 80, objectFit: 'cover'}}
                                                       className="me-3"/>
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
                            <h5 className="mt-3">Nu s-au gasit animale</h5>
                            <p className="text-muted">Nu s-au gasit animale de companie pentru
                                utilizatorul <b>{owner?.username}</b></p>
                        </div>
                    )}
                    <AddPetForm open={showAddModal} save={closeAddModalWithCount} close={closeAddModalNoCount}/>
                    <>

                    </>
                </>
            )}
            <SuccessToast show={showSuccess} close={() => setShowSuccess(false)} message={successMessage}/>
            <ErrorToast show={showError} close={() => setShowError(false)} message={error}/>
        </Container>
}
        </>
)
}