import { useContext, useEffect, useState } from "react";
import { deleteBreed, getAllBreeds, getBreedsByType } from "../api/api.ts";
import { useParams } from "react-router-dom";
import { AuthContext } from "../api/authContext.ts";
import { isAdmin } from "../api/roles.ts";
import AddBreed from "./AddBreedForm.tsx";
import { Container, Card, Row, Col, Button, Spinner, Alert, ListGroup } from "react-bootstrap";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";
import Confirm from "../components/Confirm.tsx";

type Breed = { id: number | string; name: string; petType?: { id: number | string; name: string } };
type Params = { typeName?: string };

export default function Breeds() {
    const auth = useContext(AuthContext);
    const params = useParams<Params>();
    const [breeds, setBreeds] = useState<Breed[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updatedToggle, setUpdatedToggle] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [currentBreedId, setCurrentBreedId] = useState(null);

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
            setShowSuccess(true);
            setSuccessMessage("Datele au fost sterse cu success");
        } catch (err) {
            setError(err?.message ?? "Delete failed.");
            setShowError(true);
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
                                                                <a href={`/pets/types/${breed.petType.id}/breeds`} className="no-decoration"><strong>{breed.petType.name}</strong></a>
                                                        )}
                                                    </Col>
                                                    <Col xs="auto">
                                                        {auth.user && isAdmin(auth.user.roles) && (
                                                            <Button variant="danger" size="sm" onClick={() => {
                                                                setCurrentBreedId(breed.id);
                                                                setDeleteConfirm(true);
                                                            }}>Delete</Button>
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
                            <AddBreed save={refreshRequested} showToast={() => {setShowSuccess(true); setSuccessMessage("Datele au fost salvate cu succes")}} type={params.typeName} />
                        </Card.Footer>
                    )}
                </Card>
            </Col>
            <SuccessToast close={() => setShowSuccess(false)} show={showSuccess} message={successMessage}/>
            <ErrorToast close={() => setShowError(false)} show={showError} message={error}/>
            <Confirm close={() => setDeleteConfirm(false)}
                     confirm={() => {
                        handleDelete(currentBreedId);
                        setDeleteConfirm(false);
                     }}
                     message="Doriti sa stergeti aceasta rasa?"
                     open={deleteConfirm}
            />
        </Container>
    );
}
