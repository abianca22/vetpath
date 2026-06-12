import { useContext, useEffect, useState } from "react";
import { deletePetType, getAllTypes } from "../api/api.ts";
import { Container, Card, Row, Col, Button, Spinner, Alert, ListGroup } from "react-bootstrap";
import { AuthContext } from "../api/authContext.ts";
import { isAdmin } from "../api/roles.ts";
import AddPetType from "./AddPetTypePage";
import Confirm from "../components/Confirm.tsx";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";

type PetType = { id: number | string; name: string };

export default function PetTypes() {
    const [types, setTypes] = useState<PetType[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const auth = useContext(AuthContext);
    const [updated, setUpdated] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [currentPetTypeId, setCurrentPetTypeId] = useState("");
    const [deleted, setDeleted] = useState(0);

    async function typesUpdated() {
        setUpdated(prevState => prevState + 1);
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
    }, [updated, deleted]);

    async function handleDelete(typeId: number | string) {
        setError(null);
        try {
            await deletePetType(auth.token, typeId);
            setTypes(prev => prev ? prev.filter(t => t.id !== typeId) : []);
            setDeleted(prevState => prevState + 1);
        } catch (err) {
            setError(err.message);
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
                                                        <a href={`/pets/types/${type.id}/breeds`} className="no-decoration"><strong>{type.name}</strong></a>
                                                    </Col>
                                                    <Col xs="auto">
                                                        {auth.user && isAdmin(auth.user.roles) && (
                                                            <Button variant="danger" size="sm" onClick={() => {
                                                                setCurrentPetTypeId(type.id.toString());
                                                                setDeleteConfirm(true);
                                                            }}>Stergere</Button>
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
            <Confirm confirm={() => {
                setDeleteConfirm(false);
                handleDelete(currentPetTypeId);
                setSuccessMessage("Datele au fost sterse cu succes");
                setShowSuccess(true);
            }}
                     close={() => setDeleteConfirm(false)}
                     message="Doriti sa stergeti aceasta specie?"
                     open={deleteConfirm}
            />
            <SuccessToast show={showSuccess} close={() => setShowSuccess(false)} message={successMessage}/>
            <ErrorToast show={showError} close={() => setShowError(false)} message={error}/>
        </Container>
    );
}
