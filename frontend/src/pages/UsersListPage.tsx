import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {Button, Col, Container, Form, Row, Table} from "react-bootstrap";
import {changeRole, getAllUsers} from "../api/api.ts";
import roles, {isAdmin, isVeterinarian} from "../api/roles.ts";
import {useNavigate} from "react-router-dom";


export default function UsersList() {
    const auth = useContext(AuthContext);
    const [data, setData] = useState([]);
    const [edit, setEdit] = useState(null);
    const navigate = useNavigate();

    async function handleRole(formData) {
        const findUserId = data.find(user => user.username === edit).id;
        const updatedUser = await changeRole(auth.token, findUserId, formData.get("role"));
        const updatedData = data.map(user => user.id === updatedUser.id ? updatedUser : user);
        setData(updatedData);
        setEdit(null);
    }

    useEffect(() => {
        const getUsers = async () => {
            const res = await getAllUsers(auth.token);
            setData(res);
        };
        getUsers();
    }, []);

    return (
        <>
            <Container className="d-flex flex-grow-1" fluid>
            { isAdmin(auth.user.roles) || isVeterinarian(auth.user.roles) ?
            <Row className="align-items-start h-100 w-100 justify-content-center">
                <Col className="col-9">
                    <h1 className="m-5 text-center">Utilizatori VetPath</h1>
                    <div className="table-responsive text-center">
                        <Table className="mt-5">
                            <thead>
                            <tr>
                                <th>Username</th>
                                <th>Rol</th>
                                <th>Actiuni</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                data && data.length > 0 ? data.map(user => (
                                    <tr key={user.username}>
                                        <td>{user.username}</td>
                                        <td>{
                                            edit !== user.username ?
                                            <em>{user.roles.map(role => role.name.toLowerCase()).join(", ")}</em>
                                                :
                                                <Form id={`form-${user.username}`} action={handleRole}>
                                                    <select defaultValue={user.roles[0].name} name="role">
                                                        { roles.map(role => (
                                                            <option key={role.name} value={role.name}>{role.name.toLowerCase()}</option>
                                                        ))
                                                        }
                                                    </select>
                                                </Form>
                                        }</td>
                                        <td>{
                                                edit !== user.username &&
                                                <Button variant="success" className="my-1" type="button" onClick={() => {
                                                    navigate(`/user/${user.username}`);
                                                }}>Detalii</Button>
                                            }
                                            {
                                            }
                                            {
                                                isAdmin(auth.user.roles) && (
                                                    edit !== user.username &&
                                                    <Button variant="warning" type="button" className="mx-1" onClick={() => setEdit(user.username)}>Editare rol</Button>
                                                )
                                            }
                                            {
                                                isAdmin(auth.user.roles) && (
                                                edit === user.username &&
                                                <Button variant="primary" type="submit" form={`form-${user.username}`}>Salvare</Button>
                                                )
                                            }
                                        </td>
                                    </tr>
                                )) : <tr>
                                    <td colSpan={3}>Nu exista rezultate</td>
                                </tr>

                            }
                            </tbody>
                        </Table>
                    </div>
                </Col>
            </Row>
            :
            <>
                {/* stapanii de animale pot vedea doar veterinarii */}
                <Row className="align-items-start h-100 w-100 justify-content-center">
                    <Col className="col-9">
                        <h1 className="text-center m-5">Veterinari VetPath</h1>
                        <div className="table-responsive text-center">
                            <Table className="mt-5">
                                <thead>
                                <tr>
                                    <th>
                                        Username
                                    </th>
                                    <th>
                                        Actiuni
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    data && data.length ?
                                        data.map(user => (
                                            <tr key={user.username}>
                                                <td>{user.username}</td>
                                                <td><Button variant="success" onClick={() => {
                                                    navigate(`/user/${user.username}`);
                                                }}>Detalii</Button></td>
                                            </tr>
                                        )) :
                                        <tr>
                                            <td colSpan={3} className="text-center">Nu exista rezultate</td>
                                        </tr>
                                }
                                </tbody>
                            </Table>
                        </div>
                    </Col>
                </Row>
            </>
            }
            </Container>
        </>
    );
}