// import {useContext, useEffect, useState} from "react";
// import {deleteBreed, getAllBreeds, getBreedsByType} from "../api/api.ts";
// import {useParams} from "react-router-dom";
// import {AuthContext} from "../api/authContext.ts";
// import {isAdmin} from "../api/roles.ts";
// import AddBreed from "./AddBreedForm.tsx";
// import {Button, Col, Row} from "react-bootstrap";
//
// export default function Breeds() {
//     const auth = useContext(AuthContext);
//     const [breeds, setBreeds] = useState(null);
//     const params = useParams();
//
//     useEffect(() => {
//         const fetchBreeds = async () => {
//             if (params.typeName !== null && params.typeName !== '' && params.typeName !== undefined) {
//                 const res = await getBreedsByType(params.typeName);
//                 setBreeds(res);
//             }
//             else {
//                 const res = await getAllBreeds();
//                 setBreeds(res);
//             }
//         }
//         fetchBreeds();
//     }, [breeds]);
//
//     async function handleDelete(breedId) {
//             await deleteBreed(auth.token, breedId);
//             setBreeds(breeds.filter(breed => breed.id !== breedId));
//     }
//
//     return <>
//         { breeds && breeds.length > 0 ? breeds.map(breed => (
//             <Row key={breed.id}>
//                 <Col>
//                     <h5>{breed.name}</h5>
//                 </Col>
//                 <Col>
//                     { auth.user && isAdmin(auth.user.roles) &&
//                         <Button variant="danger" onClick={() => handleDelete(breed.id)}>Elimina</Button>
//                     }
//                 </Col>
//             </Row>
//         )) : <p className="py-3">Nu s-au gasit rase de animale de companie</p> }
//         {
//             auth.user && isAdmin(auth.user.roles) &&
//             <AddBreed/>
//         }
//     </>
// }


import { useContext, useEffect, useState } from "react";
import { deleteBreed, getAllBreeds, getBreedsByType } from "../api/api.ts";
import { useParams } from "react-router-dom";
import { AuthContext } from "../api/authContext.ts";
import { isAdmin } from "../api/roles.ts";
import AddBreed from "./AddBreedForm.tsx";
import { Container, Card, Row, Col, Button, Spinner, Alert, ListGroup } from "react-bootstrap";

type Breed = { id: number | string; name: string; petType?: { id: number | string; name: string } };
type Params = { typeName?: string };

export default function Breeds() {
    const auth = useContext(AuthContext);
    const params = useParams<Params>();
    const [breeds, setBreeds] = useState<Breed[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updatedToggle, setUpdatedToggle] = useState(false);

    function refreshRequested() {
        setUpdatedToggle(prev => !prev);
    }

    useEffect(() => {
        const fetchBreeds = async () => {
            setLoading(true);
            setError(null);
            try {
                if (params.typeName) {
                    const res = await getBreedsByType(params.typeName);
                    setBreeds(Array.isArray(res) ? res : []);
                } else {
                    const res = await getAllBreeds();
                    setBreeds(Array.isArray(res) ? res : []);
                }
            } catch (err) {
                setError(err?.message ?? "Failed to load breeds.");
                setBreeds([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBreeds();
    }, [params.typeName, updatedToggle]);

    async function handleDelete(breedId: number | string) {
        setError(null);
        try {
            await deleteBreed(auth.token, breedId);
            setBreeds(prev => prev ? prev.filter(b => b.id !== breedId) : []);
        } catch (err) {
            setError(err?.message ?? "Delete failed.");
        }
    }

    return (
        <Container className="d-flex justify-content-center align-items-start" style={{ minHeight: "60vh", paddingTop: "2rem" }}>
            <Col xs={12} md={10} lg={8}>
                <Card>
                    <Card.Header className="text-center">
                        <h5 className="mb-0">Rase</h5>
                    </Card.Header>

                    <Card.Body>
                        {error && <Alert variant="danger" className="py-1">{error}</Alert>}

                        {loading ? (
                            <div className="d-flex justify-content-center py-4">
                                <Spinner animation="border" />
                            </div>
                        ) : (
                            <>
                                {breeds && breeds.length > 0 ? (
                                    <ListGroup variant="flush">
                                        {breeds.map(breed => (
                                            <ListGroup.Item key={breed.id}>
                                                <Row className="align-items-center">
                                                    <Col>
                                                        <strong>{breed.name}</strong>
                                                    </Col>
                                                    <Col>
                                                        {breed.petType && (
                                                                <a href={`/pets/types/${breed.petType.name}/breeds`} className="no-decoration"><strong>{breed.petType.name}</strong></a>
                                                        )}
                                                    </Col>
                                                    <Col xs="auto">
                                                        {auth.user && isAdmin(auth.user.roles) && (
                                                            <Button variant="danger" size="sm" onClick={() => handleDelete(breed.id)}>Delete</Button>
                                                        )}
                                                    </Col>
                                                </Row>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                ) : (
                                    <p className="py-3 mb-0">No breeds found.</p>
                                )}
                            </>
                        )}
                    </Card.Body>

                    {auth.user && isAdmin(auth.user.roles) && (
                        <Card.Footer className="d-flex justify-content-end">
                            <AddBreed save={refreshRequested} type={params.typeName} />
                        </Card.Footer>
                    )}
                </Card>
            </Col>
        </Container>
    );
}
