import {Button, Card, Col, Container, Form, Row} from "react-bootstrap";
import {useNavigate, useParams} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {deleteClinic, editClinic, getClinicById, joinClinic, leaveClinic} from "../api/api.ts";
import {isAdmin, isVeterinarian} from "../api/roles.ts";
import Confirm from "../components/Confirm.tsx";
import SuccessToast from "../components/SuccessToast.tsx";

export default function IndividualClinic() {
    const auth = useContext(AuthContext);
    const params = useParams();
    const [clinic, setClinic] = useState(null)
    const [isActive, setIsActive] = useState(false);
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showJoinConfirm, setShowJoinConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showError, setShowError] = useState(false);

    async function postData(formData) {
        const name = formData.get("name");
        const address = formData.get("address");
        const phone = formData.get("phone");
        const saveClinic = async () => {
                try {
                    const res = await editClinic(auth.token, {id: clinic.id, name: name, address: address, phoneNumber: phone, vets: []});
                    setError(null);
                    setSuccessMessage("Datele au fost salvate cu success");
                    setShowSuccess(true);
                    setClinic(res);
                }
                catch (err) {
                    setError(err.message);
                    setShowError(true);
                }
        }
        saveClinic();

    }


    function handleSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        postData(fd);
        setIsActive(false);
        navigate(`/clinics/${clinic.id}`);
    }

    useEffect(() => {
        const fetchClinic = async () => {
            try {
                const res = await getClinicById(params.id);
                setClinic(res);
            } catch (err) {
                console.log(err);
            }
        }
        fetchClinic();
    }, [params]);

    async function handleDelete() {
        try {
            await deleteClinic(auth.token, clinic.id);
            sessionStorage.setItem("deletedClinicId", clinic.id);
            navigate(`/clinics`);
        }
        catch (err) {
            console.log(err);
        }
    }

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
    }

    const closeJoinConfirm = () => {
        setShowJoinConfirm(false);
    }

    const closeLeaveConfirm = () => {
        setShowLeaveConfirm(false);
    }

    async function handleJoin() {
        try {
            const res = await joinClinic(auth.token, auth.user.username, clinic.id);
            setClinic(res);
            setSuccessMessage("Asocierea s-a produs cu success");
            setShowSuccess(true);
        }
        catch (err) {
            console.log(err);
        }
    }

    async function handleLeave() {
        try {
            const res = await leaveClinic(auth.token, auth.user.username, clinic.id);
            setClinic(res);
            setSuccessMessage("Parasirea clinicii s-a finalizat cu succes");
            setShowSuccess(true);
        }
        catch (err) {
            console.log(err);
        }
    }

    return <>
        <Container className="d-flex justify-content-center align-items-start" style={{paddingTop: '2.5rem'}}>
        <Row className="w-100 justify-content-center">
            {error && <p className="text-danger">{error}</p>}
            <Col xs={12} md={8} lg={6}>
                { clinic ? (
                    <Card className="shadow-sm p-5">
                        <Card.Body>
                            <Form id="edit-clinic-form" onSubmit={handleSubmit}>
                                <div className="d-flex flex-column align-items-center">
                                    <Form.Group controlId="clinic-name">
                                        {isActive && <Form.Label className="fw-bold mb-1 mx-2">Nume</Form.Label>}
                                        <Form.Control defaultValue={clinic.name} name="name" type="text" disabled={!isActive} className={!isActive ? 'disabled-styling' : ''}/>
                                    </Form.Group>
                                </div>

                                <hr />

                                <Row className="gx-3 gy-2">
                                    <Col xs={6} className="fw-bold">Adresa</Col>
                                    <Col xs={6}>
                                        <Form.Group controlId="clinic-address">
                                            <Form.Control as="textarea" defaultValue={clinic.address} name="address" type="text" disabled={!isActive} className={!isActive ? 'disabled-styling' : ''}/>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="gx-3 gy-2">
                                    <Col xs={6} className="fw-bold">Telefon</Col>
                                    <Col xs={6}>
                                        <Form.Group controlId="clinic-phone">
                                            <Form.Control defaultValue={clinic.phoneNumber} name="phone" type="text" disabled={!isActive} className={!isActive ? 'disabled-styling' : ''}/>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col xs={6} className="fw-bold">Medici veterinari</Col>
                                    <Col xs={6}>
                                        {clinic.vets && clinic.vets.length > 0 && clinic.vets.map(vet => (
                                            <div key={vet.id} className="text-center">
                                                <a href={`/user/${vet.username}`}>
                                                    <span>{vet.firstName} {vet.lastName}</span>
                                                </a>
                                                </div>
                                        ))}
                                    </Col>
                                </Row>

                                <hr />
                            </Form>
                        </Card.Body>

                        <Card.Footer>
                            {auth.user && isAdmin(auth.user.roles) && (
                                <div className="d-flex justify-content-between gap-2">
                                    {!isActive &&
                                        <Button variant="primary" onClick={() => setIsActive(true)}>Editare</Button>}
                                    {isActive && (
                                        <Button variant="primary" form="edit-clinic-form" type="submit">Salvare</Button>
                                    )}
                                    {!isActive &&
                                        <Button variant="danger"
                                                onClick={() => {
                                                    setShowDeleteConfirm(true);
                                                }}
                                        >Stergere</Button>
                                    }
                                </div>
                            )}
                            <div className="d-flex justify-content-center gap-2">
                                {auth.user && isVeterinarian(auth.user?.roles) && clinic && clinic.vets.filter(vet => vet.username === auth.user.username).length === 0 &&
                                    <Button variant="dark" onClick={() => setShowJoinConfirm(true)}>Asociere
                                        clinica</Button>}
                                {auth.user && clinic && clinic.vets.filter(vet => vet.username === auth.user.username).length !== 0 &&
                                    <Row>
                                        <Col>
                                    <span className="text-success fw-bold">Sunteți asociat acestei clinici</span>
                                        </Col>
                                        <Col>
                                    <Button variant="danger" onClick={() => setShowLeaveConfirm(true)}>Parasire clinica</Button>
                                        </Col>
                                </Row>
                                }
                            </div>

                        </Card.Footer>
                    </Card>
                    ) : (
                    <p className="py-3 text-center">Se încarcă...</p>
                ) }
            </Col>
        </Row>
    </Container>
    <Confirm open={showDeleteConfirm} close={closeDeleteConfirm} confirm={handleDelete} message="Doriti sa stergeti aceasta clinica?"/>
        <Confirm open={showJoinConfirm} close={closeJoinConfirm} confirm={handleJoin} message="Doriti sa va asociati acestei clinici?"/>
        <Confirm open={showLeaveConfirm} close={closeLeaveConfirm} confirm={handleLeave} message="Doriti sa parasiti aceasta clinica?"/>
        <SuccessToast show={showSuccess} close={() => setShowSuccess(false)} message={successMessage}/>
        <SuccessToast show={showError} close={() => setShowError(false)} message={error}/>
    </>

}