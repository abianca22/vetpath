import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {
    deletePet,
    editPet,
    findPetByOwnerAndName,
    findUserByUsername,
    getAllTypes, getAllUsers, getAppointmentsByPet,
    getBreedsByType, getRecordsByPet
} from "../api/api.ts";
import {Container, Row, Col, Card, Button, Form, FormSelect, Tabs, Tab, Table, Dropdown} from "react-bootstrap";
import {useNavigate, useParams} from "react-router-dom";
import type {PetDTO} from "../types.ts";
import Confirm from "../components/Confirm.tsx";
import {isAdmin, isVeterinarian} from "../api/roles.ts";
import {DatePicker} from "rsuite";
import {format} from "date-fns";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";

export default function IndividualPet() {
    const auth = useContext(AuthContext);
    const [error, setError] = useState<string | null>(null);
    const [pet, setPet] = useState<PetDTO | null>(null);
    const params = useParams();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const navigate = useNavigate();
    const [isActive, setIsActive] = useState(false);
    const [types, setTypes] = useState(null);
    const [breeds, setBreeds] = useState(null);
    const [dob, setDob] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [records, setRecords] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMesssage, setSuccessMessage] = useState("");
    const [petType, setPetType] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    async function fetchBreedsByType(typeId) {
        try {
            const res = await getBreedsByType(typeId);
            setBreeds(res);
            setError(null);
        } catch (err) {
            setError(err.message);
            setShowError(true);
            setBreeds([]);
            console.error(err.message);
        }
    }

    async function postData(formData) {
        const name = formData.get("name");
        const breedId = parseInt(formData.get("breed"));
        const weight = parseFloat(formData.get("weight"));
        const gender = formData.get("gender") as string;
        const petDob = dob ? format(dob, 'dd.MM.yyyy') : null;
        const petDobArr = petDob ? petDob.split('.').map(num => parseInt(num)) : null;
        const date = petDobArr ? new Date(petDobArr[2], petDobArr[1] - 1, petDobArr[0]) : null;
        if (date === null || isNaN(date.getTime())) {
            setError("Data nașterii nu este validă. Asigurați-vă că ați selectat o dată. Dacă nu cunoașteți data exactă, alegeți una aproximativă.");
            return;
        }
        if (date > new Date()) {
            setError("Data nașterii nu poate fi în viitor.");
            return;
        }
        if (pet) {
            const savePet = async () => {
                try {
                    await editPet(auth.token, {id: pet.id, name: name, breed: {id: breedId}, birthDate: petDob, weight: weight, gender: gender.toUpperCase(), owner: {id: selectedUser ? selectedUser.id : pet.owner.id}});
                    setShowSuccess(true);
                    setSuccessMessage("Datele au fost salvate cu succes");
                    setError(null);
                    if (selectedUser && selectedUser.id !== pet.owner.id) {
                        navigate(`/pets/${selectedUser.username}/${name}`);
                    }
                }
                catch (err) {
                    setError(err.message);
                    setShowError(true);
                    console.error(err.message);
                }
            }
            savePet();
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        postData(fd);
        setIsActive(false);
        navigate(`/pets/${params.username}/${fd.get("name")}`);
    }


    useEffect(() => {
        if (!isAdmin(auth.user.roles) && auth.user.username !== params.username && !isVeterinarian(auth.user.roles)) {
            navigate("/access-denied");
        }
        const fetchPet = async () => {
            try {
                const user = await findUserByUsername(auth.token, params.username);
                console.log(user);
                const pets = await findPetByOwnerAndName(auth.token, params.username, params.petName);
                const pet = pets.filter(p => p.name === params.petName)[0];
                setPet(pet);
                setPetType(pet.breed.petType.id.toString());
                setSelectedUser(pet.owner);
                setError(null);
                console.log(pet);
                const fetchBD = async () => {
                    if (pet && pet.birthDate) {
                        setDob(new Date(parseInt(pet.birthDate.split('.')[2]), parseInt(pet.birthDate.split('.')[1]) - 1, parseInt(pet.birthDate.split('.')[0])));
                    }
                }
                fetchBD();
                const fetchTypes = async () => {
                    try {
                        const res = await getAllTypes();
                        setTypes(res);
                        setError(null);
                        await fetchBreedsByType(pet.breed.petType.id);

                    }
                    catch (err) {
                        setError(err.message);
                        setShowError(true);
                        console.error(err);
                    }
                }
                fetchTypes();
                const fetchAppointments = async () => {
                    try {
                        const res = await getAppointmentsByPet(auth.token, pet.id);
                        setAppointments(res);
                    } catch (err) {
                        setError(err.message);
                        setShowError(true);
                        setAppointments([]);
                    }
                }
                fetchAppointments();
                const fetchRecords = async () => {
                    try {
                        const res = await getRecordsByPet(auth.token, pet.id);
                        setRecords(res);
                    } catch (err) {
                        setError(err.message);
                        setShowError(true);
                        console.error(err.message);
                        setRecords([]);
                    }
                }
                fetchRecords();
            } catch (err) {
                setError(err.message);
                setShowError(true);
                console.error(err.message);
            }
        }
        fetchPet();
        if (isAdmin(auth.user.roles)) {
            const fetchUsers = async() => {
                const resUsers = await getAllUsers(auth.token, null, null);
                setUsers(resUsers);
            }
            fetchUsers();
        }
    }, [params.username, params.petName]);

    async function handleDelete() {
        try {
            await deletePet(auth.token, pet.id);
            sessionStorage.setItem("deletedPetId", pet.id.toString());
            navigate(`/pets/${auth.user.username}`);
        }
        catch (err) {
            console.log(err);
        }
    }

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
    }

    async function filterUsers(keyword) {
        try {
            const resUsers = await getAllUsers(auth.token, keyword, null);
            setUsers(resUsers);
        }
        catch (err) {
            setError(err.message);
            setShowError(true);
            console.error(err);
        }
    }

    return <>
        {error && <p className="text-danger">{error}</p>}
        <Container className="align-items-start" style={{paddingTop: '2.5rem'}}>
            <Row className="w-100 justify-content-center">
                <Col xs={12} md={8} lg={6}>
                    { error && <p className="text-danger text-center"><small>{error}</small></p> }

                    { pet ? (
                        <Card className="shadow-sm p-5">
                            <Card.Body>
                                <Form id="edit-pet-form" onSubmit={handleSubmit}>
                                <div className="d-flex flex-column align-items-center">
                                    <Form.Group controlId="pet-name">
                                        {isActive && <Form.Label className="fw-bold mb-1 mx-2">Nume</Form.Label>}
                                        <Form.Control defaultValue={pet.name} name="name" type="text" disabled={!isActive} className={!isActive ? 'disabled-styling' : ''}/>
                                    </Form.Group>
                                    <small className="text-muted">Proprietar: {params.username}</small>
                                </div>

                                <hr />

                                <Row className="gx-3 gy-2">
                                    <Col xs={6} className="fw-bold d-flex align-items-center">Specie</Col>
                                    <Col xs={6}>
                                        <Form.Group controlId="pet-type">
                                            <FormSelect
                                                name="type" value={petType} onChange={(e) => {
                                                const selectedTypeId = e.target.value;
                                                e.persist();
                                                setPetType(selectedTypeId);
                                                if (selectedTypeId !== '') {
                                                    fetchBreedsByType(selectedTypeId);
                                                }
                                            }} disabled={!isActive} className={!isActive ? 'disabled-styling' : ''}>
                                                <option value="" hidden={isActive}>Selectati o specie</option>
                                                {types && types.length > 0 ? types.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name}</option>
                                                )) : <option disabled>Nu s-au găsit tipuri</option>}
                                            </FormSelect>
                                        </Form.Group>
                                        </Col>
                                    <Col xs={6} className="fw-bold d-flex align-items-center" hidden={!isAdmin(auth.user.roles)}>
                                        Proprietar
                                    </Col>
                                    <Col xs={6} hidden={!isAdmin(auth.user.roles)}>
                                        <Form.Group style={{paddingLeft: '0.7rem'}} controlId="pet-owner">
                                            <Dropdown>
                                                <Dropdown.Toggle as="div">{selectedUser?.username}</Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                        <Form.Control onChange={(e) => filterUsers(e.target.value)}></Form.Control>
                                                    {
                                                        users && users.length > 0 && users.map((user, index) =>
                                                        <Dropdown.Item key={index} as="div" onClick={() => setSelectedUser(user)}>
                                                            {user.username}
                                                        </Dropdown.Item>)
                                                    }
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </Form.Group>
                                        </Col>
                                    <Col xs={6} className="fw-bold d-flex align-items-center">Rasă</Col>
                                    <Col xs={6}>
                                        <Form.Group controlId="pet-breed">
                                            <FormSelect name="breed" defaultValue={pet.breed ? pet.breed.id : ''} disabled={!isActive}>
                                                {breeds && breeds.length > 0 ? breeds.map(breed => (
                                                    <option key={breed.id} value={breed.id}>{breed.name}</option>
                                                )) : <option disabled>Nu s-au găsit rase</option>}
                                            </FormSelect>
                                        </Form.Group>
                                    </Col>

                                    <Col xs={6} className="fw-bold d-flex align-items-center">Data nașterii</Col>
                                    <Col xs={6}><Form.Group controlId="pet-dob">
                                        <div>
                                            <DatePicker disabled={!isActive} className="custom-picker"
                                                format="dd.MM.yyyy"
                                                value={dob}
                                                onChange={setDob}
                                                style={{width: '100%'}}
                                                container={() => document.body}
                                                oneTap={false}
                                            />
                                        </div>
                                    </Form.Group>
                                    </Col>

                                    <Col xs={6} className="fw-bold d-flex align-items-center">Greutate</Col>
                                    <Col xs={6}><Form.Group controlId="pet-weight">
                                            <Form.Control disabled={!isActive} defaultValue={pet.weight} name="weight" type="number" step={0.01} className={!isActive ? 'disabled-styling' : ''}
                                            />
                                    </Form.Group>
                                    </Col>

                                    <Col xs={6} className="fw-bold d-flex align-items-center">Gen</Col>
                                    <Col xs={6}>
                                        <Form.Group controlId="pet-gender">
                                            <FormSelect name="gender" defaultValue={pet ? pet?.gender.toLowerCase() : 'none'} aria-label="Gender" disabled={!isActive} className={!isActive ? 'disabled-styling' : ''}>
                                                <option value="male">Mascul</option>
                                                <option value="female">Femela</option>
                                                <option value="none">Nu se mentioneaza</option>
                                            </FormSelect>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <hr />
                                </Form>
                            </Card.Body>

                            <Card.Footer>
                                {(pet.owner.id === auth.user.id || isAdmin(auth.user.roles)) && (
                                    <div className="d-flex justify-content-between gap-2">
                                        {!isActive && <Button variant="primary" onClick={() => setIsActive(true)}>Editare</Button>}
                                        {isActive && (
                                            <Button variant="primary" form="edit-pet-form" type="submit">Salvare</Button>
                                        )}
                                        {!isActive &&
                                        <Button variant="danger" onClick={() => {
                                            setShowDeleteConfirm(true);
                                        }}>Stergere</Button>
                                        }
                                    </div>
                                )}
                            </Card.Footer>
                        </Card>
                    ) : (
                        <p className="py-3 text-center">Se încarcă...</p>
                    ) }
                </Col>
            </Row>
            <Row className="w-100 justify-content-center mt-2">
                <Col xs={12} md={8} lg={6}>
                    <Tabs
                        defaultActiveKey="appointments"
                        className="mb-3"
                        justify
                    >
                        <Tab eventKey="appointments" title="Istoric Programari">
                            <Table>
                                <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Clinica</th>
                                    <th>Veterinar</th>
                                    <th>Status</th>
                                </tr>
                                </thead>
                                <tbody>
                                {appointments && appointments.length > 0 ? appointments.map(app => (
                                    <tr key={app.id} onClick={() => {
                                        sessionStorage.setItem("appointmentId", app.id.toString());
                                        navigate(`/appointments/details`);
                                    }
                                    } style={{cursor: 'pointer'}}>
                                        <td>{app.slot}</td>
                                        <td>{app.clinic?.name}</td>
                                        <td>{app.vet?.firstName} {app.vet?.lastName}</td>
                                        <td>{app.status.toLowerCase().includes("cancelled") ? 'Anulata' : 'Activa'}</td>
                                    </tr>
                                )) : <tr><td colSpan={4} className="text-center">Nu există programări</td></tr>}
                                </tbody>
                            </Table>
                        </Tab>
                        <Tab eventKey="history" title="Istoric Medical">
                            <Table>
                                <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Clinica</th>
                                    <th>Veterinar</th>
                                </tr>
                                </thead>
                                <tbody>
                                {records && records.length > 0 ? records.map(record => (
                                    <tr key={record.id} onClick={() => {
                                        sessionStorage.setItem("recordId", record.id.toString());
                                        navigate(`/records/details`);
                                    }} style={{cursor: 'pointer'}}>
                                        <td>{record.recordDate}</td>
                                        <td>{record.appointment?.clinic?.name}</td>
                                        <td>{record.vet?.firstName} {record.vet?.lastName}</td>
                                    </tr>
                                )) : <tr><td colSpan={3} className="text-center">Nu există rapoarte medicale</td></tr>}
                                </tbody>
                            </Table>
                        </Tab>
                    </Tabs>
                </Col>
            </Row>
            <SuccessToast close={() => setShowSuccess(false)} show={showSuccess} message={successMesssage}></SuccessToast>
            <ErrorToast close={() => setShowError(false)} show={showError} messsage={error}></ErrorToast>
        </Container>
        <Confirm open={showDeleteConfirm} close={closeDeleteConfirm} confirm={handleDelete} message="Doriti sa stergeti acest animal de companie?"/>

    </>
 }
