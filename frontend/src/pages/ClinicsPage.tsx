import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {useNavigate} from "react-router-dom";
import {getAllClinics} from "../api/api.ts";
import {Button, Col, Container, Row, Table} from "react-bootstrap";
import {isAdmin} from "../api/roles.ts";
import AddClinicForm from "./AddClinicForm.tsx";

export default function Clinics() {
    const auth = useContext(AuthContext);
    const [data, setData] = useState([]);
    const navigate = useNavigate();

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


    useEffect(() => {
        const getClinics = async () => {
            const res = await getAllClinics();
            setData(res);
        };
        getClinics();
    }, [auth.token, closeCount]);

    return (
            <Container className="d-flex flex-grow-1" fluid>
                    <Row className="align-items-start h-100 w-100 justify-content-center">
                        <Col className="col-9">
                            <h1 className="m-5 text-center">Clinici inregistrate</h1>
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
                <AddClinicForm open={showAddModal} save={closeAddModalWithCount} close={closeAddModalNoCount}/>
            </Container>
    )
}

// de adaugat optiune pentru veterinari sa se asocieze unei clinici 
