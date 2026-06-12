import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {Button, Col, Container, Form, Row, Table} from "react-bootstrap";
import {changeRole, getAllUsers, getAllVeterinarians} from "../api/api.ts";
import roles, {isAdmin, isPetOwner, isVeterinarian} from "../api/roles.ts";
import {useNavigate} from "react-router-dom";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";


export default function UsersList() {
    const auth = useContext(AuthContext);
    const [data, setData] = useState([]);
    const [edit, setEdit] = useState(null);
    const navigate = useNavigate();
    const [lastRole, setLastRole] = useState("");
    const [lastUserString, setLastUserString] = useState("");
    const [error, setError] = useState(null);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    async function handleRole(formData) {
        try {
            const findUserId = data.find(user => user.username === edit).id;
            const updatedUser = await changeRole(auth.token, findUserId, formData.get("role"));
            const updatedData = data.map(user => user.id === updatedUser.id ? updatedUser : user);
            setData(updatedData);
            setEdit(null);
            setShowSuccess(true);
        }
        catch (err) {
            setError(err.message);
            setShowError(true);
        }
    }

    async function handleSearch(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        let userString = formData.get("userString");
        setLastUserString(userString.toString());
        let currentRole = formData.get("currentRole");
        setLastRole(currentRole.toString());
        if (userString === "") {
            userString = null;
        }
        if (currentRole === "") {
            currentRole = null;
        }
        if (isPetOwner(auth.user.roles)) {
            const res = await getAllVeterinarians(auth.token, userString);
            setData(res);
        }
        else if (isAdmin(auth.user.roles) || isVeterinarian(auth.user.roles)) {
            const res = await getAllUsers(auth.token, userString, currentRole);
            setData(res);
        }
    }

    useEffect(() => {
        const getUsers = async () => {
            if (isPetOwner(auth.user.roles)) {
                const res = await getAllVeterinarians(auth.token, null);
                setData(res);
            }
            else if (isAdmin(auth.user.roles) || isVeterinarian(auth.user.roles)) {
                const res = await getAllUsers(auth.token, null, null);
                setData(res);
            }
        };
        getUsers();
    }, []);

    return (
        <>
            <Container className="d-flex flex-grow-1" fluid>
            <Row className="align-items-start h-100 w-100 justify-content-center">
                <Col className="col-9">
                    {
                        isPetOwner(auth.user.roles) ?
                        <h1 className="m-5 text-center">Personal VetPath</h1> :
                        <h1 className="m-5 text-center">Utilizatori VetPath</h1>
                    }
                    <Form className="d-flex" onSubmit={handleSearch} id="search-form">
                        <Form.Group hidden={isPetOwner(auth.user.roles)} className="m-2">
                            <Form.Label>Rol</Form.Label>
                            <Form.Select name="currentRole" value={lastRole} onChange={(e) => setLastRole(e.target.value)}>
                                <option value="">Toate rolurile</option>
                                {roles.map(role => (
                                    <option key={role.name} value={role.name}>{role.name.toLowerCase()}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="m-2">
                            <Form.Label>Nume</Form.Label>
                            <Form.Control name="userString" value={lastUserString} onChange={(e) => setLastUserString(e.target.value)}></Form.Control>
                        </Form.Group>
                        <Form.Group className="d-flex align-items-end m-2">
                            <Button type="submit" variant="primary" form="search-form">Cautare</Button>
                            <Button type="button" variant="secondary" className="mx-2" onClick={() => {setLastRole(""); setLastUserString("")}}>Resetare</Button>
                        </Form.Group>
                    </Form>
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
                                                edit === user.username && <>
                                                <Button variant="primary" type="submit" form={`form-${user.username}`}>Salvare</Button>
                                                <Button variant="warning" type="button" onClick={() => setEdit(null)}>Renuntare</Button>
                                                </>
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
                <SuccessToast close={() => setShowSuccess(false)} message="Datele au fost salvate cu succes" show={showSuccess}/>
                <ErrorToast close={() => setShowError(false)} message={error} show={showError}/>
            </Container>
        </>
    );
}