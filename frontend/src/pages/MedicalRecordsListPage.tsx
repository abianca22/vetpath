import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {Button, Col, Container, Row, Table} from "react-bootstrap";
import {useNavigate} from "react-router-dom";
import {isAdmin, isVeterinarian} from "../api/roles.ts";
import {getRecords, getRecordsByVet} from "../api/api.ts";


export default function RecordsList() {
    const auth = useContext(AuthContext);
    const [records, setRecords] = useState([]);
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    // const [filters, setFilters] = useState({
    //     startDate: null,
    //     endDate: null,
    //     vetUsername: '',
    //     petName: '',
    //     petOwner: '',
    //     status: '',
    //     clinic: ''
    // });
    //
    // const openAddModal = () => {
    //     setShowAddModal(true);
    // }
    // const closeAddModalWithCount = () => {
    //     setShowAddModal(false);
    //     setCloseCount(prev => prev + 1);
    // }
    // const closeAddModalNoCount = () => {
    //     setShowAddModal(false);
    // }
    //
    // const openCancelModal = () => {
    //     setShowCancelModal(true);
    // }
    // const closeCancelModalWithCount = () => {
    //     setShowCancelModal(false);
    //     setCurrentAppointment(null);
    //     setCancelCloseCount(prev => prev + 1);
    // }
    // const closeCancelModalNoCount = () => {
    //     setShowCancelModal(false);
    //     setCurrentAppointment(null);
    // }
    //
    // function pastAppointment(app) {
    //     const date = moment(`${app.slot.split(' ')[0].split('.').reverse().join('-')} ${app.slot.split(' ')[1]}`);
    //     return date.isSameOrBefore(moment());
    // }

    useEffect(() => {
        const fetchRecords = async() => {
            try {
                if (isAdmin(auth.user.roles)) {
                    const res = await getRecords(auth.token, null);
                    setRecords(res);
                }
                else if (isVeterinarian(auth.user.roles)) {
                    const res = await getRecordsByVet(auth.token, auth.user.id);
                    setRecords(res);
                }
                else {
                    const res = await getRecords(auth.token, auth.user.username);
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

    // const handleFilterSubmit = (e) => {
    //     e.preventDefault();
    //
    //     const selectedFilters = Object.fromEntries(
    //         Object.entries(filters)
    //         // .filter(([, value]) => value !== null && value !== "")
    //     );
    //
    //     // const fetchFilteredAppointments = async() => {
    //     //     try {
    //     //
    //     //         const res = await fetchAppointments(auth.token, filters.startDate, filters.endDate, null, filters.vetUsername !== '' ? filters.vetUsername : null, filters.clinic !== '' ? filters.clinic : null, filters.status !== '' ? filters.status : null, filters.petOwner !== '' ? filters.petOwner : null);
    //     //         setAppointments(res);
    //     //         setError(null)
    //     //     }
    //     //      catch(err) {
    //     //          setError(err);
    //     //      }
    //     // }
    //     // fetchFilteredAppointments();
    //
    //     console.log(selectedFilters);
    // };

    return (
        <Container className="d-flex flex-grow-1" fluid>
            <Row className="align-items-start h-100 w-100 justify-content-center">
                <Col className="col-9">
                    <h1 className="m-5 text-center">Rapoarte medicale</h1>
                    {error && error.split('\n').map((err, index) => <p key={index} className="text-danger mb-1"><small>{err}</small></p>)}
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