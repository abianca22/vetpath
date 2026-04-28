import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {Button, Col, Container, Row, Table} from "react-bootstrap";
import {getAppointments} from "../api/api.ts";
import AddAppointmentForm from "./AddAppointmentForm.tsx";
import CancelAppointmentForm from "../components/CancelAppointmentForm.tsx";


export default function AppointmentsList() {
    const auth = useContext(AuthContext);
    const [appointments, setAppointments] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [closeCount, setCloseCount] = useState(0);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelCloseCount, setCancelCloseCount] = useState(0);
    const [currentAppointment, setCurrentAppointment] = useState(null);

    // const [searchParams, setSearchParams] = useSearchParams();
    // const [data, setData] = useState([]);
    // const [edit, setEdit] = useState(null);
    // const navigate = useNavigate();


    useEffect(() => {
        const findAppointments = async () => {
            const res = await getAppointments(auth.token);
            setAppointments(res);
        }
        findAppointments();
    }, [auth.token, closeCount, cancelCloseCount]);

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

    const openCancelModal = () => {
        setShowCancelModal(true);
    }
    const closeCancelModalWithCount = () => {
        setShowCancelModal(false);
        setCurrentAppointment(null);
        setCancelCloseCount(prev => prev + 1);
    }
    const closeCancelModalNoCount = () => {
        setShowCancelModal(false);
        setCurrentAppointment(null);
    }


    return (
        <Container className="d-flex flex-grow-1" fluid>
            <Row className="align-items-start h-100 w-100 justify-content-center">
                <Col className="col-9">
                    <h1 className="m-5 text-center">Programari</h1>
                    <div className="d-flex flex-grow-1">
                        <Row>
                        <Col>
                            <Button variant="primary" onClick={openAddModal}>Adaugare programare</Button>
                        </Col>
                        </Row>
                    </div>
                    <div className="table-responsive text-center">
                        <Table className="mt-5">
                            <thead>
                            <tr>
                                <th>Start (durata 30 min)</th>
                                <th>Veterinar</th>
                                <th>Clinica</th>
                                <th>Animal de companie</th>
                                <th>Status</th>
                                <th>Actiuni</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                appointments && appointments.length > 0 ? appointments.map(app => (
                                    <tr key={app.id}>
                                        <td>{app.slot}</td>
                                        <td>{app.vet.username}</td>
                                        <td>{app.clinic ? app.clinic.name : ''}</td>
                                        <td>{app.pet.name} ({app.pet.owner.username})</td>
                                        <td>{app.status.includes('BOOKED') ? 'Activa' : `Anulata de ${app.cancelledBy.username} ${app.cancelReason !== null && app.cancelReason !== '' ? ` (Motiv anulare: ${app.cancelReason})`: ''}`}</td>
                                        <td>{(app.vet.id === auth.user.id || app.pet.owner.id === auth.user.id) && app.status.includes('BOOKED') && <Button variant="danger" onClick={() => {setCurrentAppointment(app); openCancelModal();}}>Anulare</Button>}</td>
                                    </tr>
                                )) : <tr>
                                    <td colSpan={4}>Nu exista rezultate</td>
                                </tr>
                            }
                            {/*{*/}
                            {/*    data && data.length > 0 ? data.map(user => (*/}
                            {/*        <tr key={user.username}>*/}
                            {/*            <td>{user.username}</td>*/}
                            {/*            <td>{*/}
                            {/*                edit !== user.username ?*/}
                            {/*                    <em>{user.roles.map(role => role.name.toLowerCase()).join(", ")}</em>*/}
                            {/*                    :*/}
                            {/*                    <Form id={`form-${user.username}`} action={handleRole}>*/}
                            {/*                        <select defaultValue={user.roles[0].name} name="role">*/}
                            {/*                            { roles.map(role => (*/}
                            {/*                                <option key={role.name} value={role.name}>{role.name.toLowerCase()}</option>*/}
                            {/*                            ))*/}
                            {/*                            }*/}
                            {/*                        </select>*/}
                            {/*                    </Form>*/}
                            {/*            }</td>*/}
                            {/*            <td>{*/}
                            {/*                edit !== user.username &&*/}
                            {/*                <Button variant="success" className="my-1" type="button" onClick={() => {*/}
                            {/*                    navigate(`/user/${user.username}`);*/}
                            {/*                }}>Detalii</Button>*/}
                            {/*            }*/}
                            {/*                {*/}
                            {/*                }*/}
                            {/*                {*/}
                            {/*                    isAdmin(auth.user.roles) && (*/}
                            {/*                        edit !== user.username &&*/}
                            {/*                        <Button variant="warning" type="button" className="mx-1" onClick={() => setEdit(user.username)}>Editare rol</Button>*/}
                            {/*                    )*/}
                            {/*                }*/}
                            {/*                {*/}
                            {/*                    isAdmin(auth.user.roles) && (*/}
                            {/*                        edit === user.username &&*/}
                            {/*                        <Button variant="primary" type="submit" form={`form-${user.username}`}>Salvare</Button>*/}
                            {/*                    )*/}
                            {/*                }*/}
                            {/*            </td>*/}
                            {/*        </tr>*/}
                            {/*    )) : <tr>*/}
                            {/*        <td colSpan={3}>Nu exista rezultate</td>*/}
                            {/*    </tr>*/}

                            {/*}*/}
                            </tbody>
                        </Table>
                    </div>
                </Col>
            </Row>
            <AddAppointmentForm open={showAddModal} save={closeAddModalWithCount} close={closeAddModalNoCount} reload={cancelCloseCount} appointments={appointments}/>
            <CancelAppointmentForm open={showCancelModal} save={closeCancelModalWithCount} close={closeCancelModalNoCount} slot={currentAppointment}/>
        </Container>

    );
}