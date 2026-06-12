import {Button, Card, Col, Container, Row} from "react-bootstrap";
import {AuthContext} from "../api/authContext.ts";
import {useContext, useEffect, useState} from "react";
import {approveResponse, deleteQuestion, fetchQuestion, getRecordsByPet} from "../api/api.ts";
import {useNavigate, useParams} from "react-router-dom";
import Confirm from "../components/Confirm.tsx";
import {isAdmin, isVeterinarian} from "../api/roles.ts";
import FormatText from "../FormatText.tsx";

export default function QuestionResponse() {
    const auth = useContext(AuthContext);
    const [error, setError] = useState(null);
    const [entry, setEntry] = useState(null);
    const navigate = useNavigate();
    const params = useParams();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [records, setRecords] = useState([]);
    const [generated, setGenerated] = useState(false);
    const [showCreateConfirm, setShowCreateConfirm] = useState(false);

    function closeCreateConfirm() {
        setShowCreateConfirm(false);
    }

    function closeDeleteConfirm() {
        setShowDeleteConfirm(false);
    }

    async function generateRecord() {
        try {
            await approveResponse(auth.token, entry.id);
            setGenerated(true);
        }
        catch (err) {
            setError(err.message);
            console.error(err.message);
        }
    }

    useEffect(() => {
        const fetchEntry = async() => {
            try {
                const res = await fetchQuestion(auth.token, sessionStorage.getItem("questionId"));
                setEntry(res);
                console.log(res.timestamp);
                setError(null);
                if (res.pet) {
                    try {
                        const records = await getRecordsByPet(auth.token, res.pet.id);
                        const filteredRecords = records.filter(record => record.vet.id === auth.user.id);
                        setRecords(filteredRecords);
                        console.log(filteredRecords);
                        console.log(res);
                    }
                    catch(err) {
                        setError(err.message);
                        console.error(err.message);
                        setRecords([]);
                    }
                }
            }
            catch(err) {
                setError(err);
                navigate("/access-denied");
            }
        }
        fetchEntry();
    }, [generated]);

    async function handleDelete() {
        try {
            await deleteQuestion(auth.token, sessionStorage.getItem("questionId"));
            sessionStorage.removeItem("questionId");
            navigate(`/ask/history/${params.username}`);
        }
        catch(err) {
            setError(err);
        }
    }

    return <>
        {error && <p className="text-danger">{error}</p>}
        <Container className="d-flex justify-content-center align-items-start" style={{paddingTop: '2.5rem'}}>
            <Row className="w-100 justify-content-center">
                <Col className="col-8">
                    { error && <p className="text-danger text-center"><small>{error}</small></p> }

                    { entry ? (
                        <Card className="shadow-sm p-5">
                            <Card.Body>
                                    <div className="d-flex flex-column align-items-center">
                                        <h5>Intrebare</h5>
                                    </div>
                                    <hr />
                                    <Row className="mt-3">
                                        <Col xs={3} className="fw-bold">Data inregistrarii:</Col>
                                        <Col></Col>
                                        <Col xs={3}>
                                            <div>
                                                {entry.timestamp}
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row className="mt-3">
                                        <Col xs={3} className="fw-bold">Animal de companie:</Col>
                                        <Col></Col>
                                        <Col xs={3}>
                                            <div>
                                            {entry.pet?.name} (Proprietar: {entry.pet?.owner?.username})
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row className="mt-3">
                                        <Col xs={3} className="fw-bold">Subiect:</Col>
                                        <Col></Col>
                                        <Col xs={3}>
                                            <div>
                                            {entry.userMessage}
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row className="mt-3">
                                        <label className="fw-bold mb-3">Raspuns:</label>
                                            <div>
                                                <FormatText message={entry?.botResponse}></FormatText>
                                            </div>
                                    </Row>
                                <hr />
                            </Card.Body>
                            <Card.Footer>

                                    <Row>
                                        <Col>
                                            {
                                                isVeterinarian(auth.user.roles) && records && records.length > 0 && entry.medicalRecord === null && entry.approvedBy === null &&
                                                <Button onClick={() => setShowCreateConfirm(true)}>Generare raport</Button>
                                            }
                                            {
                                                (isVeterinarian(auth.user.roles) || (auth.user.id === entry.pet.owner.id)) && entry.medicalRecord !== null &&
                                                <Button onClick={() => {
                                                    sessionStorage.setItem("recordId", entry.medicalRecord.id.toString());
                                                    navigate('/records/details');
                                                }}>Vizualizare raport</Button>
                                            }
                                        </Col>
                                        <Col className="d-flex justify-content-end">
                                            {
                                                (isAdmin(auth.user.roles) || auth.user.username === params.username) &&
                                        <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>Stergere</Button>
                                            }
                                        </Col>
                                    </Row>

                            </Card.Footer>
                        </Card>
                    ) : (
                        <p className="py-3 text-center">Se încarcă...</p>
                    ) }
                </Col>
            </Row>
            {/*<MedicalRecordForm open={showModal} save={() => {*/}
            {/*    setShowModal(false);*/}
            {/*}} close={() => setShowModal(false)} appointment={record?.appointment}/>*/}
            <Confirm open={showDeleteConfirm} close={closeDeleteConfirm} confirm={handleDelete} message="Doriti sa stergeti aceasta intrebare din istoric? Va atentionam ca aceasta actiune este iremediabila."/>
            <Confirm open={showCreateConfirm} close={closeCreateConfirm} confirm={generateRecord} message="Doriti sa generati un raport in baza acestui raspuns?"/>
        </Container>
    </>

}