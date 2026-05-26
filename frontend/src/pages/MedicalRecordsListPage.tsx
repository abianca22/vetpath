import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {Button, Col, Container, Form, Row, Table} from "react-bootstrap";
import {useNavigate, useSearchParams} from "react-router-dom";
import {isAdmin, isVeterinarian} from "../api/roles.ts";
import {filterPets, getAllBreeds, getAllTypes, getBreedsByType, getRecords, getRecordsByVet} from "../api/api.ts";
import {FormControlLabel, Switch} from "@mui/material";
import {DatePicker} from "rsuite";


export default function RecordsList() {
    const auth = useContext(AuthContext);
    const [records, setRecords] = useState([]);
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [lastOwnerString, setLastOwnerString] = useState("");
    const [lastNameString, setLastNameString] = useState("");
    const [lastType, setLastType] = useState("");
    const [lastBreed, setLastBreed] = useState("");
    const [types, setTypes] = useState([]);
    const [breeds, setBreeds] = useState([]);
    const [checked, setChecked] = useState(false);
    const [lastVetString, setLastVetString] = useState("");
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    async function fetchBreedsByType(typeId) {
        try {
            const res = await getBreedsByType(typeId);
            setBreeds(res);
            setError(null);
        } catch (err) {
            setError(err.message);
            setBreeds([]);
        }
    }

    function handleCheckedChange() {
        setChecked(!checked);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        let startDate = null;
        let endDate = null;
        if (start !== null) {
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            } as const;
            startDate = new Intl.DateTimeFormat('en-GB', options).format(start).replaceAll('/', '.').replace(', ', ' ');
        }
        if (end !== null) {
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
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
        const formData = new FormData(e.target);
        let vet = formData.get("vet");
        setLastVetString(vet.toString());
        let owner = formData.get("owner");
        setLastOwnerString(owner.toString());
        let name = formData.get("name");
        setLastNameString(name.toString());
        let typeId = formData.get("type");
        setLastType(typeId.toString());
        let breedId = formData.get("breed");
        setLastBreed(breedId.toString());

        if (vet === '' || vet === undefined) {
            vet = null;
        }
        if (owner === '' || owner === undefined) {
            owner = null;
        }
        if (name === '' || name === undefined) {
            name = null;
        }
        if (breedId === '' || breedId === undefined) {
            breedId = null;
        }
        if (typeId === '' || typeId === undefined) {
            typeId = null;
        }

        try {
            const res = await filterPets(auth.token, owner, name, typeId, breedId);
            const records = [];
            for (let i = 0; i < res.length; i++) {
                let localRes;
                if (isAdmin(auth.user.roles)) {
                    localRes = await getRecords(auth.token, vet, null, res[i].name, checked, startDate, endDate);
                }
                else if (isVeterinarian(auth.user.roles)) {
                    localRes = await getRecordsByVet(auth.token, auth.user.id, null, res[i].name, checked, startDate, endDate);
                }
                else {
                    localRes = await getRecords(auth.token, vet, auth.user.username, res[i].name, checked, startDate, endDate);
                }
                records.push(...localRes);
            }
            setRecords(records);
        }
        catch(err) {
            setError(err);
        }
    }

    useEffect(() => {
        const loadSearchParams = () => {
            if (searchParams.get("startDate") !== null) {
                let date = [];
                date.push(...searchParams.get("startDate").split('.'));
                date = date.map(component => parseInt(component));
                setStart(new Date(date[2], date[1], date[0]));
            }
            if (searchParams.get("endDate") !== null) {
                let date = [];
                date.push(...searchParams.get("endDate").split('.'));
                date = date.map(component => parseInt(component));
                setEnd(new Date(date[2], date[1], date[0]));
            }
        }
        loadSearchParams();

        const fetchTypes = async () => {
            try {
                const res = await getAllTypes();
                setTypes(res);
                setError(null);
            }
            catch (err) {
                setError(err.message);
            }
        }
        fetchTypes();

        const fetchBreeds = async () => {
            try {
                const res = await getAllBreeds();
                setBreeds(res);
                setError(null);
            } catch (err) {
                setError(err.message);
            }
        }
        fetchBreeds();

        const fetchRecords = async() => {
            try {
                if (isAdmin(auth.user.roles)) {
                    const res = await getRecords(auth.token, null, null, null, false, searchParams.get("startDate"), searchParams.get("endDate"));
                    setRecords(res);
                }
                else if (isVeterinarian(auth.user.roles)) {
                    const res = await getRecordsByVet(auth.token, auth.user.id, null, null, false, searchParams.get("startDate"), searchParams.get("endDate"));
                    setRecords(res);
                }
                else {
                    const res = await getRecords(auth.token, null, auth.user.username, null, false, searchParams.get("startDate"), searchParams.get("endDate"));
                    setRecords(res);
                }
                setError(null);
            }
            catch(err) {
                setError(err);
                setRecords([]);
            }
        }
        fetchRecords();
    }, []);

    return (
        <Container className="d-flex flex-grow-1" fluid>
            <Row className="align-items-start h-100 w-100 justify-content-center">
                <Col className="col-9">
                    <h1 className="m-5 text-center">Rapoarte medicale</h1>
                    {error && error.split('\n').map((err, index) => <p key={index} className="text-danger mb-1"><small>{err}</small></p>)}
                    <Form className="d-flex justify-content-start mb-5" onSubmit={handleSubmit}>
                        <Form.Group className="m-2" hidden={isVeterinarian(auth.user.roles)}>
                                <Form.Label>Veterinar</Form.Label>
                                <br/>
                                <Form.Control name="vet" type="text" value={lastVetString} onChange={(e) => setLastVetString(e.target.value)}></Form.Control>
                        </Form.Group>
                        <Form.Group className="m-2">
                            <Form.Label>Utilizator</Form.Label>
                            <br/>
                            <Form.Control name="owner" type="text" value={lastOwnerString} onChange={(e) => setLastOwnerString(e.target.value)}></Form.Control>
                        </Form.Group>
                        <Form.Group className="m-2">
                            <Form.Label>Animal</Form.Label>
                            <br/>
                            <Form.Control name="name" type="text" value={lastNameString} onChange={(e) => setLastNameString(e.target.value)}></Form.Control>
                        </Form.Group>
                        <Form.Group className="m-2">
                            <Form.Label>Specie</Form.Label>
                            <br/>
                            <Form.Select name="type" value={lastType} onChange={(e) => {
                                const selectedTypeId = e.target.value;
                                e.persist();
                                setLastType(selectedTypeId);
                                fetchBreedsByType(selectedTypeId);
                            }}>
                                <option value="" hidden={true}></option>
                                {
                                    types && types.length > 0 ? (types.map(type =>
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        )) :
                                        <option disabled>Niciun rezultat</option>
                                }
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="m-2">
                            <Form.Label>Rasa</Form.Label>
                            <br/>
                            <Form.Select name="breed" value={lastBreed} onChange={(e) => setLastBreed(e.target.value)}>
                                <option value="" hidden={true}></option>
                                {breeds && breeds.length > 0 ?
                                    breeds.map(breed => <option key={breed.id} value={breed.id}>{breed.name}</option>) :
                                    <option disabled>Niciun rezultat</option>
                                }
                            </Form.Select>
                        </Form.Group>
                        <Form.Group controlId="slot-start" className="m-2 d-flex align-items-end">
                            <DatePicker
                                    format="dd.MM.yyyy"
                                    value={start}
                                    onChange={setStart}
                                    style={{width: '100%'}}
                                    container={() => document.body}
                                    oneTap={false}
                            />
                        </Form.Group>
                        <Form.Group controlId="slot-end" className="m-2 d-flex align-items-end">
                            <DatePicker
                                    format="dd.MM.yyyy"
                                    value={end}
                                    onChange={setEnd}
                                    style={{width: '100%'}}
                                    container={() => document.body}
                                    oneTap={false}
                            />
                        </Form.Group>
                        <Form.Group className="m-2 d-flex align-items-end">
                            <FormControlLabel control={<Switch checked={checked} onChange={handleCheckedChange}/>} label={checked ? "Generate" : "Toate"}></FormControlLabel>
                        </Form.Group>
                        <Form.Group className="m-2 d-flex align-items-end">
                            <Button type="submit" variant="primary" className="mx-2">Cautare</Button>
                            <Button type="button" variant="secondary" onClick={() => {
                                setLastNameString("");
                                setLastOwnerString("");
                                setLastBreed("");
                                setLastType("");
                                setStart(null);
                                setEnd(null);
                                setSearchParams({});
                                setChecked(false);
                            }}>Resetare</Button>
                            <Button type="button" variant="success" className="mx-2" href={`/pets/${auth.user.username}`}>Animalele mele</Button>
                        </Form.Group>
                    </Form>
                    <div className="table-responsive text-center">
                        <Table className="mt-5">
                            <thead>
                            <tr>
                                <th>Data raport</th>
                                <th>Data programare</th>
                                <th>Animal companie</th>
                                <th>Veterinar</th>
                                <th>Actiuni</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                records && records.length > 0 ? records.map(record => (
                                    <tr key={record.id}>
                                        <td>{record.recordDate}</td>
                                        <td>{record.appointment?.slot}</td>
                                        <td>{record.pet?.name} (Detinator: {record.pet?.owner.username})</td>
                                        <td>{record.vet?.username} (Clinica: {record.appointment?.clinic?.name})</td>
                                        <td>
                                            <Button variant="success" onClick={() => {sessionStorage.setItem("recordId", record.id.toString()); navigate('/records/details');}}>Detalii</Button>
                                        </td>
                                    </tr>
                                )) : <tr>
                                    <td colSpan={6}>Nu exista rezultate</td>
                                </tr>
                            }
                            </tbody>
                        </Table>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}