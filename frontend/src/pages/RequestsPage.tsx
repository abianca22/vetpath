import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSquareCheck} from "@fortawesome/free-solid-svg-icons";
import {useNavigate} from "react-router-dom";

export default function SendRequestPage() {
    const auth = useContext(AuthContext);
    const [users, setUsers] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const apiBase = "http://localhost:8081/api/admin/users";
    const authHeader = { Authorization: `Bearer ${auth.token}` };

    const fetchRequests = async () => {
        const res = await fetch(`${apiBase}/requests`, { headers: authHeader });
        setUsers(await res.json());
    };

    const handleAcceptRequest = async (id) => {
        try {
            await fetch(`${apiBase}/${id}/change-role?approved=true`, { method: "POST", headers: authHeader });
            await fetchRequests();
            setShowSuccess(true);
        } catch (err) { setError(err); setShowError(true); }
    };

    const handleDeclineRequest = async (id) => {
        try {
            await fetch(`${apiBase}/${id}/change-role?approved=false`, { method: "POST", headers: authHeader });
            await fetchRequests();
        } catch (err) { setError(err); setShowError(true); }
    };

    useEffect(() => {
        const getRequests = async () => {
        fetchRequests();
    }
    getRequests();
    }, []);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Cereri</h1>
                <p className="mt-0.5 text-sm text-slate-400">Solicitări pentru rolul de medic veterinar</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
                {!users || users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <FontAwesomeIcon icon={faSquareCheck} size="3x" className="text-emerald-600"/>
                        <p className="mt-3 text-sm">Nu există cereri neprocesate</p>
                    </div>
                ) : users.map(user => (
                    <div key={user.username} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                            {user.username?.[0]?.toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0 mt-3 hover:cursor-pointer" onClick={() => navigate(`/user/${user.username}`)}>
                            <p className="font-semibold text-slate-800">{user.username}</p>
                        </div>

                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={() => handleAcceptRequest(user.id)}
                                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                            >
                                Acceptă
                            </button>
                            <button
                                onClick={() => handleDeclineRequest(user.id)}
                                className="rounded-xl bg-red-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-600 transition"
                            >
                                Respinge
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <SuccessToast close={() => setShowSuccess(false)} show={showSuccess} message="Cererea a fost procesată cu succes!" />
            <ErrorToast close={() => setShowError(false)} show={showError} message={error} />
        </div>
    );
}
