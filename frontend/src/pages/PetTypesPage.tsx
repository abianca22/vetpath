// import {useContext, useEffect, useState} from "react";
// import {deletePetType, getAllTypes} from "../api/api.ts";
// import {Button, Col, Row} from "react-bootstrap";
// import {AuthContext} from "../api/authContext.ts";
// import {isAdmin} from "../api/roles.ts";
// import AddPetType from "./AddPetTypePage.tsx";
//
// export default function PetTypes() {
//     const [types, setTypes] = useState(null);
//     const auth = useContext(AuthContext);
//     const [error, setError] = useState(null);
//
//     useEffect(() => {
//         const fetchTypes = async () => {
//             const res = await getAllTypes();
//             setTypes(res);
//         }
//         fetchTypes();
//     }, [types]);
//
//     async function handleDelete(typeId) {
//         try {
//             await deletePetType(auth.token, typeId);
//             setTypes(types.filter(type => type.id !== typeId));
//             setError(null);
//         }
//         catch (err) {
//             setError(err.message);
//         }
//     }
//
//     return <>
//         { error && <p className="text-danger"><small>{error}</small></p> }
//         { types && types.length > 0 ? types.map(type => (
//             <Row key={type.id}>
//                 <Col>
//                     <h5>{type.name}</h5>
//                 </Col>
//                 <Col>
//                     { auth.user && isAdmin(auth.user.roles) &&
//                         <Button variant="danger" onClick={() => handleDelete(type.id)}>Elimina</Button>
//                     }
//                 </Col>
//             </Row>
//         )) : <p className="py-3">Nu s-au gasit tipuri de animale de companie</p> }
//         { auth.user && isAdmin(auth.user.roles) &&
//             <>
//                 <AddPetType/>
//                 </>
//         }
//     </>
// }

// src/pages/PetTypesPage.tsx
import { useContext, useEffect, useState } from "react";
import { deletePetType, getAllTypes } from "../api/api.ts";
import { Container, Card, Row, Col, Button, Spinner, Alert, ListGroup } from "react-bootstrap";
import { AuthContext } from "../api/authContext.ts";
import { isAdmin } from "../api/roles.ts";
import AddPetType from "./AddPetTypePage";

type PetType = { id: number | string; name: string };

export default function PetTypes() {
    const [types, setTypes] = useState<PetType[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const auth = useContext(AuthContext);
    const [updated, setUpdated] = useState(false);

    async function typesUpdated() {
        setUpdated(true);
    }

    useEffect(() => {
        const fetchTypes = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getAllTypes();
                setTypes(Array.isArray(res) ? res : []);
            } catch (err) {
                setError(err?.message ?? "Failed to load types.");
                setTypes([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTypes();
    }, [updated]);

    async function handleDelete(typeId: number | string) {
        setError(null);
        try {
            await deletePetType(auth.token, typeId);
            setTypes(prev => prev ? prev.filter(t => t.id !== typeId) : []);
        } catch (err) {
            setError(err?.message ?? "Delete failed.");
        }
    }



    return (
        <Container className="d-flex justify-content-center align-items-start" style={{ minHeight: "60vh", paddingTop: "2rem" }}>
            <Col xs={12} md={10} lg={8}>
                <Card>
                    <Card.Header className="text-center">
                        <h5 className="mb-0">Specii</h5>
                    </Card.Header>
                    <Card.Body>
                        {error && <Alert variant="danger" className="py-1">{error}</Alert>}

                        {loading ? (
                            <div className="d-flex justify-content-center py-4">
                                <Spinner animation="border" />
                            </div>
                        ) : (
                            <>
                                {types && types.length > 0 ? (
                                    <ListGroup variant="flush">
                                        {types.map(type => (
                                            <ListGroup.Item key={type.id}>
                                                <Row className="align-items-center">
                                                    <Col>
                                                        <a href={`/pets/types/${type.name}/breeds`} className="no-decoration"><strong>{type.name}</strong></a>
                                                    </Col>
                                                    <Col xs="auto">
                                                        {auth.user && isAdmin(auth.user.roles) && (
                                                            <Button variant="danger" size="sm" onClick={() => handleDelete(type.id)}>Stergere</Button>
                                                        )}
                                                    </Col>
                                                </Row>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                ) : (
                                    <p className="py-3 mb-0">No pet types found.</p>
                                )}
                            </>
                        )}
                    </Card.Body>
                    {auth.user && isAdmin(auth.user.roles) && (
                        <Card.Footer className="d-flex justify-content-end">
                            <AddPetType save={typesUpdated} />
                        </Card.Footer>
                    )}
                </Card>
            </Col>
        </Container>
    );
}
