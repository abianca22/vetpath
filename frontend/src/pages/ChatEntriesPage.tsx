import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {useNavigate, useParams} from "react-router-dom";
import {Button, Col, Container, Row, Table} from "react-bootstrap";
import {fetchChatEntries} from "../api/api.ts";

export default function ChatEntries(){
    const auth = useContext(AuthContext);
    const params = useParams();
    const [entries, setEntries] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEntries = async() => {
            try {
                const res = await fetchChatEntries(auth.token, params.username);
                console.log(res);
                setEntries(res)
                setError(null);
            }
            catch (err) {
                setError(err);
                navigate("/access-denied");
            }
        }
        fetchEntries();
        console.log(error);
    }, [params.username]);

    return <Container className="d-flex flex-grow-1" fluid>
        <Row className="align-items-start h-100 w-100 justify-content-center">
            <Col className="col-9">
                <h1 className="m-5 text-center">Istoric intrebari</h1>
                    <div className="d-flex justify-content-end">
                    <Button variant="secondary" href="/ask">Puneti o intrebare</Button>
                    </div>
                <div className="table-responsive text-center">
                    <Table className="mt-5">
                        <thead>
                        <tr>
                            <th>Data</th>
                            <th>Animal de companie</th>
                            <th>Intrebare</th>
                            <th>Raspuns</th>
                            <th>Actiuni</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            entries && entries.length > 0 ? entries.map(entry => (
                                <tr key={entry.id}>
                                    <td>{entry.timestamp}</td>
                                    <td>{entry.pet.name}</td>
                                    <td>{entry.userMessage.split(" ").slice(0, 5).join(" ")}{entry.userMessage.split(" ").length > 5 ? ' [...]' : ''}</td>
                                    <td>{entry.botResponse.split(" ").slice(0, 5).join(" ")}{entry.botResponse.split(" ").length > 5 ? ' [...]' : ''}</td>
                                    <td className="d-flex">
                                        <Button variant="success" onClick={() => {
                                            sessionStorage.setItem("questionId", entry.id.toString());
                                            navigate(`/ask/history/${params.username}/details`);
                                        }}>Detalii</Button>
                                    </td>
                                </tr>
                            )) : <tr>
                                <td colSpan={5}>Nu exista rezultate</td>
                            </tr>
                        }
                        </tbody>
                    </Table>
                </div>
            </Col>
        </Row>
        {/*<Confirm open={showConfirmDialog} close={() => {closeConfirmDialog(); navigate("/slots");}} confirm={() => {handleDelete(currentSlotId); setCurrentSlotId(null);}} message="Doriti sa eliminati acest slot?"/>*/}
    </Container>

}