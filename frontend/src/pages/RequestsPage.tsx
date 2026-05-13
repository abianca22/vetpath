import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {Button, Col, Container, Row, Table} from "react-bootstrap";

export default function SendRequestPage() {
    const auth = useContext(AuthContext);
    const [users, setUsers] = useState(null);

    const handleAcceptRequest = (id) => {
        const reqOpts = {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${auth.token}`
            }
        };
        const acceptRequest = async () => {
            await fetch(`http://localhost:8081/api/admin/users/${id}/change-role?approved=true`, reqOpts);
            const res = await fetch(`http://localhost:8081/api/admin/users/requests`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                }
            });
            setUsers(await res.json()
            );
        };
        acceptRequest();
    }

    const handleDeclineRequest = (id) => {
        const reqOpts = {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${auth.token}`
            }
        };
        const declineRequest = async () => {
            await fetch(`http://localhost:8081/api/admin/users/${id}/change-role?approved=false`, reqOpts);
            const resUsers = await fetch(`http://localhost:8081/api/admin/users/requests`,
                {
                    method: "GET",
                    headers: {
                        'Authorization': `Bearer ${auth.token}`
                    }
                });
            setUsers(await resUsers.json());
        };
        declineRequest();
    }

    useEffect(() => {
        const reqOpts = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${auth.token}`
            }
        }
        const fetchUsers = async () => {
            const res = await fetch(`http://localhost:8081/api/admin/users/requests`,
                reqOpts);
            setUsers(await res.json());
        }
        fetchUsers();
    }, []);

    return (
        <Container className="py-3 d-flex flex-grow-1" fluid>
                        <Row className="w-100 justify-content-center">
                            <Col className="col-10">
                                <h3 className="text-center">Solicitari pentru rolul de medic veterinar</h3>
                                <div className="table-responsive text-center">
                                    <Table className="mt-5">
                                        <thead>
                                        <tr>
                                            <th>Utilizatori</th>
                                            <th>Actiuni</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {(users && users.length > 0) ? users.map(user =>
                                            <tr key={user.username}>
                                                <td>{user.username}</td>
                                                <td>
                                                    <Button variant="success" className="mx-2" onClick={() => {handleAcceptRequest(user.id)}}>Accepta</Button>
                                                    <Button variant="danger" onClick={() => {handleDeclineRequest(user.id)}}>Respinge</Button>
                                                </td>
                                            </tr>
                                            ) :
                                            <tr>
                                            <td colSpan={2} className="text-center">Nu exista cereri neprocesate</td>
                                            </tr>
                                        }
                                        </tbody>
                                    </Table>
                                </div>
                            {/*<ListGroup>*/}
                            {/*    {*/}
                            {/*        (users && users.length > 0) ? users.map(user =>*/}
                            {/*            <ListGroup.Item key={user.username}>Username: {user.username}*/}
                            {/*                <Button variant="success" className="mx-2" onClick={() => {handleAcceptRequest(user.id)}}>Accepta</Button>*/}
                            {/*                <Button variant="danger" onClick={() => {handleDeclineRequest(user.id)}}>Respinge</Button>*/}
                            {/*            </ListGroup.Item>*/}
                            {/*        ) :*/}
                            {/*            <ListGroup.Item className="text-center">Nu exista cereri neprocesate</ListGroup.Item>*/}
                            {/*    }*/}
                            {/*</ListGroup>*/}
                            </Col>
                        </Row>
        </Container>
    );
}
