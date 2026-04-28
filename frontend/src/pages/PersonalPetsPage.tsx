import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {findPetByOwnerAndName, findUserByUsername} from "../api/api.ts";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {Button, Card, Col, Container, Row, Spinner, Badge, Image} from "react-bootstrap";
import AddPetForm from "./AddPetForm.tsx";
import type {PetDTO, RoleDTO, UserDTO} from "../types.ts";
import {isPetOwner} from "../api/roles.ts";

type PetWithPhoto = PetDTO & { photoUrl?: string };

export default function PersonalPets() {
    const auth = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const petName = searchParams.get("name");
    const [pets, setPets] = useState<PetWithPhoto[] | null>(null);
    const params = useParams();
    const [owner, setOwner] = useState<UserDTO | {id?: string, username?: string, profileUrl?: string, roles?: RoleDTO[]}>({username: params.username});
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [closeCount, setCloseCount] = useState(0);
    const navigate = useNavigate();

    const [showAddModal, setShowAddModal] = useState(false);

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
    const fetchPets = async () => {
        try {
            setLoading(true);
            const ownerRes = await findUserByUsername(auth.token, params.username);
            setOwner(ownerRes);
            setIsOwner(auth.user.id === ownerRes.id);
            let res;
            if (petName === null || petName === '' || petName === undefined)
                res = await findPetByOwnerAndName(auth.token, params.username);
            else
                res = await findPetByOwnerAndName(auth.token, params.username, petName);
            setPets(res);
            if(auth.user.id !== ownerRes.id && isPetOwner(auth.user.roles)) {
                navigate('/access-denied');
                return;
            }
        }
        catch (err) {
            console.log(err);
            setPets([]);
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPets();
    }, [params.username, petName, closeCount]);

    // async function handleDelete(petId: number) {
    //     try {
    //         // const ok = window.confirm('Stergeti acest animal de companie?');
    //         // if (!ok) return;
    //         await deletePet(auth.token, petId);
    //         setPets(prev => prev ? prev.filter(pet => pet.id !== petId) : prev);
    //         if (currentPet.id === petId) {
    //             setCurrentPet(null);
    //         }
    //     }
    //     catch (err) {
    //         console.log(err);
    //     }
    // }

    return (
        <>
        { !(!isOwner && isPetOwner(auth.user.roles)) &&
        <Container className="py-4">
            <Row className="align-items-center mb-4">
                <Col xs="auto">
                    <Image src={owner?.profileUrl} roundedCircle width={80} height={80} alt="owner"/>
                </Col>
                <Col>
                    <h2 className="mb-0">{owner?.username}</h2>
                    <div className="text-muted">Animale de companie</div>
                </Col>
                <Col xs="auto">
                    {isOwner && (
                        <Button variant="primary" onClick={openAddModal}>Adauga un animal</Button>
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
                </>
            )}
        </Container>
}
        </>
)
}