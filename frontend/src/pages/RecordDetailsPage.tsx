import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {useNavigate} from "react-router-dom";
import {
    deleteRecord, editRecord, getQuestionByRecord,

    getRecordById
} from "../api/api.ts";
import {Button, Card, Col, Container, Form, FormControl, Row} from "react-bootstrap";
import {isAdmin} from "../api/roles.ts";
import MedicalRecordForm from "./MedicalRecordForm.tsx";
import Confirm from "../components/Confirm.tsx";
import FormatText from "../FormatText.tsx";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";

export default function RecordDetails() {
    const auth = useContext(AuthContext);
    const recordId = parseInt(sessionStorage.getItem("recordId"));
    const [record, setRecord] = useState(null);
    const [error, setError] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [chatEntry, setChatEntry] = useState(null);

    function closeDeleteConfirm() {
        setShowDeleteConfirm(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const postData = new FormData(e.target);
        const symptoms = postData.get("symptoms");
        const diagnosis = postData.get("diagnosis");
        const treatment = postData.get("treatment");
        const recordData = {symptoms: symptoms, diagnosis: diagnosis, treatment: treatment, pet: {id: record?.pet?.id}, vet: {id: record?.vet?.id}, recordDate: record?.recordDate, appointment: {id: record?.appointment?.id}};
        try {
            const res = await editRecord(auth.token, record.id, recordData);
            setRecord(res);
            setIsActive(false);
            setError(null);
            setShowSuccess(true);
        }
        catch(err) {
            setError(err.message);
            setShowError(true);
        }

    }

    async function handleDelete() {
        try {
            await deleteRecord(auth.token, recordId);
            sessionStorage.removeItem("recordId");
            navigate("/records");
        }
        catch(err) {
            setError(err.message);
            setShowError(true);
        }
    }

    useEffect(() => {
        const fetchRecord = async() => {
            try {
                const res = await getRecordById(auth.token, recordId);
                setRecord(res);
                setError(null);
                try {
                    const entry = await getQuestionByRecord(auth.token, recordId);
                    setChatEntry(entry);
                }
                catch(err) {
                    setError(err.message);
                }
            }
            catch(err) {
                setError(err.message);
                setShowError(true);
            }

        }
        fetchRecord();

    }, []);



    return <>
        {error && <p className="text-danger">{error}</p>}
        <Container className="d-flex justify-content-center align-items-start" style={{paddingTop: '2.5rem'}}>
            <Row className="w-100 justify-content-center">
                <Col className="col-10">
                    { error && <p className="text-danger text-center"><small>{error}</small></p> }

                    { record ? (
                        <Card className="shadow-sm p-5">
                            <Card.Body>
                                <Form id="edit-record-form" onSubmit={handleSubmit}>
                                    <div className="d-flex flex-column align-items-center">
                                        <h5>Raport medical</h5>
                                    </div>
                                    <hr />
                                    { record.appointment &&
                                    <Row className="mt-3">
                                        <Col xs={6} className="fw-bold">Data programarii:</Col>
                                        <Col xs={6}>
                                            {record.appointment?.slot}
                                        </Col>
                                    </Row>
                                    }
                                <Row className="mt-3">
                                    <Col xs={6} className="fw-bold">Data adaugarii raportului:</Col>
                                    <Col xs={6}>
                                        {record.recordDate}
                                    </Col>
                                </Row>
                                    <Row className="mt-3">
                                        <Col xs={6} className="fw-bold">Animal de companie:</Col>
                                        <Col xs={6}>
                                            {record.pet?.name}
                                        </Col>
                                    </Row>
                                <Row className="mt-3">
                                    <Col xs={6} className="fw-bold">Proprietar:</Col>
                                    <Col xs={6}>
                                        {record.pet ? record.pet.owner?.username : record.appointment?.currentOwner?.username}
                                    </Col>
                                </Row>
                                <Row className="mt-3">
                                    <Col xs={6} className="fw-bold">Simptome:</Col>
                                    <Col xs={6} className="d-flex justify-content-start">
                                        <Form.Group controlId="symptoms" className="w-100">
                                            <FormControl name="symptoms" type="text" as="textarea" rows={record.symptoms ? (record.symptoms?.split(" ").length  + record.symptoms?.split("\n").length) / 3 : 1} defaultValue={record.symptoms !== 'none' ? record.symptoms : ''} disabled={!isActive}></FormControl>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className="mt-3">
                                    <Col xs={6} className="fw-bold">Diagnostic:</Col>
                                    <Col xs={6} className="d-flex justify-content-start">
                                        { isActive ?
                                        <Form.Group controlId="diagnosis" className="w-100">
                                            <FormControl name="diagnosis" type="text" as="textarea" rows={record.diagnosis ? (record.diagnosis?.split(" ").length + record.diagnosis?.split("\n").length) / 6 : 1} defaultValue={record.diagnosis} disabled={!isActive}></FormControl>
                                        </Form.Group> :
                                            <div>
                                            <FormatText message={record.diagnosis}></FormatText>
                                            </div>
                                        }
                                    </Col>
                                </Row>
                                <Row className="mt-3">
                                    <Col xs={6} className="fw-bold">Tratament/Recomandări:</Col>
                                    <Col xs={6} className="d-flex justify-content-start">
                                            <Form.Group controlId="treatment" className="w-100">
                                            <FormControl name="treatment" type="text" as="textarea" rows={record.treatment ? (record.treatment?.split(" ").length + record.treatment?.split("\n").length) / 6 : 1} defaultValue={record.treatment} disabled={!isActive}></FormControl>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                </Form>
                                    <hr />
                            </Card.Body>
                            <Card.Footer>
                                {(record.vet?.id === auth.user.id && (record?.appointment?.clinic?.vets.some(vet => vet.id === auth.user.id)
                                        ||
                                        (chatEntry && chatEntry.approvedBy && chatEntry.approvedBy.id === auth.user.id)
                                    )
                                    || isAdmin(auth.user.roles))  && <>
                                    {!isActive ?
                                        <>
                                            <Row>
                                            <Col> {
                                                record.pet &&
                                                <Button variant="primary" onClick={() => {
                                        setIsActive(true);
                                            }}>Editare</Button>
                                            }
                                            </Col>
                                                <Col className="text-end">
                                                    <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>Stergere</Button>
                                                </Col>
                                            </Row>
                                        </> :
                                <Button type="submit" form="edit-record-form">Salvare</Button>}
                                </>
                                }
                            </Card.Footer>
                        </Card>
                    ) : (
                        <p className="py-3 text-center">Se încarcă...</p>
                    ) }
                </Col>
            </Row>
            <MedicalRecordForm open={showModal} save={() => {
                setShowModal(false);
            }} close={() => setShowModal(false)} appointment={record?.appointment}/>
            <Confirm open={showDeleteConfirm} close={closeDeleteConfirm} confirm={handleDelete} message="Doriti sa stergeti acest raport medical?"/>
        </Container>
        <SuccessToast close={() => setShowSuccess(false)} show={showSuccess} message="Datele au fost modificate cu succes!"/>
        <ErrorToast close={() => setShowError(false)} show={showError} message={error}/>
        </>
}