import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {Button, Col, Container, Form, Row, Table} from "react-bootstrap";
// import roles, {isAdmin, isVeterinarian} from "../api/roles.ts";
// import {useNavigate} from "react-router-dom";
import {deleteSlot, findUserByUsername, getSlots} from "../api/api.ts";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import AddSlotForm from "./AddSlotForm.tsx";
import {DatePicker} from "rsuite";
import {isVeterinarian} from "../api/roles.ts";
import Confirm from "../components/Confirm.tsx";


export default function SlotsList() {
    const auth = useContext(AuthContext);
    const [slots, setSlots] = useState([]);
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [error, setError] = useState(null);
    // const [data, setData] = useState([]);
    // const [edit, setEdit] = useState(null);
    const navigate = useNavigate();
    const [showAddModal, setShowAddModal] = useState(false);
    const [closeCount, setCloseCount] = useState(0);
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [currentSlotId, setCurrentSlotId] = useState(null);


    const closeConfirmDialog = () => {
        setShowConfirmDialog(false);
    }

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

    function handleSearch(e) {
        e.preventDefault();
        // const fd = new FormData(e.target);
        let startDate = null;
        let endDate = null;
        if (start !== null) {
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            } as const;
            startDate = new Intl.DateTimeFormat('en-GB', options).format(start).replaceAll('/', '.').replace(', ', ' ');
        }
        if (end !== null) {
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            } as const;
            endDate = new Intl.DateTimeFormat('en-GB', options).format(end).replaceAll('/', '.').replace(', ', ' ');
        }
        if (startDate !== null && endDate !== null) {
            setSearchParams({startDate: startDate, endDate: endDate});
        } else if (startDate !== null) {
            setSearchParams({startDate: startDate});
        } else if (endDate !== null) {
            setSearchParams({endDate: endDate});
        } else {
            setSearchParams({});
        }
        const getSlotsWithParams = async () => {
            try {
                const res = await getSlots(auth.token, params && params.username ? params.username : auth.user.username, searchParams.get("startDate"), searchParams.get("endDate"));
                setSlots(res);
                setError(null);
            } catch (err) {
                setError(err.message);
            }
        }
        getSlotsWithParams();
    }

    async function handleDelete(id) {
        try {
            await deleteSlot(auth.token, id);
        }
        catch (err) {
            setError(err.message);
        }
    }

    useEffect(() => {
        if (params.username) {
            const findUser = async () => {
                const res = await findUserByUsername(auth.token, params.username);
                if (!isVeterinarian(res.roles)) {
                    navigate('/access-denied');
                }
            }
            findUser();
        }
        const findSlots = async () => {
            const res = await getSlots(auth.token, params && params.username ? params.username : auth.user.username, searchParams.get("startDate"), searchParams.get("endDate"));
            setSlots(res);
        }
        findSlots();
    }, [auth.token, params, searchParams, closeCount]);

    return (
            <Container className="d-flex flex-grow-1" fluid>
                <Row className="align-items-start h-100 w-100 justify-content-center">
                    <Col className="col-9">
                        <h1 className="m-5 text-center">Sloturi</h1>
                        <div className="d-flex justify-content-evenly">
                                <Row>
                                    <Col>
                                <Form id="slot-search-form" onSubmit={handleSearch}>
                                    <div>
                                        <Row>
                                            <Col>
                                    <Form.Group controlId="slot-start">
                                            {/*<Form.Label className="fw-medium mb-1">Data start</Form.Label>*/}
                                                <DatePicker
                                                    format="dd.MM.yyyy HH:mm"
                                                    value={start}
                                                    onChange={setStart}
                                                    style={{width: '100%'}}
                                                    container={() => document.body}
                                                    oneTap={false}
                                                />
                                        </Form.Group>
                                            </Col>
                                            <Col>
                                    <Form.Group controlId="slot-end">
                                        {/*<Form.Label className="fw-medium mb-1">Data start</Form.Label>*/}
                                        <DatePicker
                                            format="dd.MM.yyyy HH:mm"
                                            value={end}
                                            onChange={setEnd}
                                            style={{width: '100%'}}
                                            container={() => document.body}
                                            oneTap={false}
                                        />
                                    </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>
                                </Form>
                                    </Col>
                                    <Col>
                                        <Button type="submit" form="slot-search-form">Cautare</Button>
                                    </Col>
                                    {(!params.username || (params && params.username && params.username === auth.user.username)) &&
                                    <Col>
                                <Button variant="primary" onClick={openAddModal}>Adaugare slot</Button>
                                    </Col>
                                    }
                                </Row>
                            </div>
                        { error && <p className="text-danger p-5 pb-0">{error}</p> }
                        <div className="table-responsive text-center">
                                <Table className="mt-5">
                                    <thead>
                                    <tr>
                                        <th>Start (durata 30 min)</th>
                                        <th>Veterinar</th>
                                        <th>Clinica</th>
                                        <th>Status</th>
                                        <th>Actiuni</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        slots && slots.length > 0 ? slots.filter(slot => !slot.status.includes('CANCELLED')).map(slot => (
                                            <tr key={slot.id}>
                                                <td>{slot.slot}</td>
                                                <td>{slot.vet.username}</td>
                                                <td>{slot.clinic.name}</td>
                                                <td>{slot.status.includes('AVAILABLE') ? 'Liber': 'Ocupat'}</td>
                                                <td>{auth.user.username === slot.vet.username && <Button variant="danger" onClick={() => {setCurrentSlotId(slot.id); setShowConfirmDialog(true)}}>Stergere</Button>}</td>
                                            </tr>
                                        )) : <tr>
                                            <td colSpan={4}>Nu exista rezultate</td>
                                        </tr>
                                    }
                                    </tbody>
                                </Table>
                            </div>
                        </Col>
                    </Row>
                <AddSlotForm open={showAddModal} save={closeAddModalWithCount} close={closeAddModalNoCount}/>
                <Confirm open={showConfirmDialog} close={() => {closeConfirmDialog(); navigate("/slots");}} confirm={() => {handleDelete(currentSlotId); setCurrentSlotId(null);}} message="Doriti sa eliminati acest slot?"/>
            </Container>

    );
}