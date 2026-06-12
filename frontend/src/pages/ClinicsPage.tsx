import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {useNavigate} from "react-router-dom";
import {getAllClinics} from "../api/api.ts";
import {Button, Col, Container, Form, Row, Table} from "react-bootstrap";
import {isAdmin} from "../api/roles.ts";
import AddClinicForm from "./AddClinicForm.tsx";
import SuccessToast from "../components/SuccessToast.tsx";

export default function Clinics() {
    const auth = useContext(AuthContext);
    const [data, setData] = useState([]);
    const navigate = useNavigate();
    const [lastVetString, setLastVetString] = useState("");
    const [lastClinicString, setLastClinicString] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const [showAddModal, setShowAddModal] = useState(false);
    const [closeCount, setCloseCount] = useState(0);

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

    async function handleSearch(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        let clinic = formData.get("name");
        setLastClinicString(clinic.toString());
        let vet = formData.get("employee");
        setLastVetString(vet.toString())
        if (clinic === "") {
            clinic = null;
        }
        if (vet === "") {
            vet = null;
        }
        try {
            const res = await getAllClinics(clinic, vet);
            setData(res);
        }
        catch(err) {
            console.error(err);
        }
    }


    useEffect(() => {
        const getClinics = async () => {
            const res = await getAllClinics(null, null);
            setData(res);
        };
        getClinics();
        const checkClinicDeletion = function() {
            if (sessionStorage.getItem("deletedClinicId") !== null) {
                setShowSuccess(true);
                setSuccessMessage("Datele au fost sterse cu success");
                sessionStorage.removeItem("deletedClinicId");
            }
        }
        checkClinicDeletion();
    }, [closeCount]);

    return (
            <Container className="d-flex flex-grow-1" fluid>
                    <Row className="align-items-start h-100 w-100 justify-content-center">
                        <Col className="col-9">
                            <h1 className="m-5 text-center">Clinici inregistrate</h1>
                            <Form id="search-for-clinic-form" onSubmit={handleSearch} className="d-flex">
                                <Form.Group className="m-2">
                                    <Form.Label>Denumire</Form.Label>
                                    <Form.Control type="text" name="name" value={lastClinicString} onChange={(e) => setLastClinicString(e.target.value)}>
                                    </Form.Control>
                                </Form.Group>
                                <Form.Group className="m-2">
                                    <Form.Label>Veterinar</Form.Label>
                                    <Form.Control type="text" name="employee" value={lastVetString} onChange={(e) => setLastVetString(e.target.value)}>
                                    </Form.Control>
                                </Form.Group>
                                <Form.Group className="m-2 d-flex align-items-end">
                                    <Button className="mx-2" variant="primary" type="submit" form="search-for-clinic-form">Cautare</Button>
                                    <Button variant="secondary" type="button" onClick={() => {
                                        setLastClinicString("");
                                        setLastVetString("");
                                    }}>Resetare</Button>
                                </Form.Group>
                            </Form>
                            <div className="table-responsive text-center">
                                <Table className="mt-5">
                                    <thead>
                                    <tr>
                                        <th>Nume</th>
                                        <th>Actiuni</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        data && data.length > 0 ? data.map(clinic => (
                                            <tr key={clinic.id}>
                                                <td>{clinic.name}</td>
                                                <td>{
                                                    <Button variant="success" className="my-1" type="button" onClick={() => {
                                                        navigate('/clinics/' + clinic.id);
                                                    }}>Detalii</Button>
                                                }
                                                </td>
                                            </tr>
                                        )) : <tr>
                                            <td colSpan={3}>Nu exista rezultate</td>
                                        </tr>

                                    }
                                    </tbody>
                                </Table>
                                {
                                    auth.user && isAdmin(auth.user.roles) && <div className="text-center">
                                        <Button variant="primary" onClick={openAddModal}>Adaugare</Button>
                                    </div>
                                }
                            </div>
                        </Col>
                    </Row>
                <AddClinicForm open={showAddModal} save={closeAddModalWithCount} close={closeAddModalNoCount} showToast={() => {
                    setSuccessMessage("Datele au fost salvate cu success");
                    setShowSuccess(true);
                }}/>
                <SuccessToast message={successMessage} close={() => setShowSuccess(false)} show={showSuccess}></SuccessToast>
            </Container>
    )
}

