import {useState} from "react";
import type {UserDTO} from "../types";
import {Button} from "react-bootstrap";
import {isVeterinarian} from "../api/roles.ts";

function VetRequest({auth}) {
    const [currentUser, setCurrentUser] = useState<UserDTO|null>(auth.user);
    function handleRequest() {
        const reqOpt = {
            method: "PUT",
            headers: {
                'Authorization': `Bearer ${auth.token}`
            }
        };
        const fetchData = async () => {
            try {
                const res = await fetch(`http://localhost:8081/api/users/${currentUser.id}/request-role-change`, reqOpt);
                setCurrentUser(await res.json());
                console.log(currentUser);
            }
            catch(err) {
                console.log(err);
            }
        }
        fetchData();
    }

    return (
        <>
            { currentUser ? ((!currentUser?.pendingRequest && !isVeterinarian(currentUser.roles)) ? <>
                        <p className="mt-3 fw-medium">Solicita schimbarea rolului in medic veterinar</p>
                        <Button onClick={handleRequest} variant="success">Solicitare</Button>
                    </>: (!isVeterinarian(currentUser.roles) ? (<p className="py-3"><em>Solicitare rol medic veterinar in curs de validare...</em></p>) : (<></>)) ) : <p className="py-3">Loading...</p> }

        </>
    );
}

export default VetRequest;