import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import {
    updateData,
    deleteUser,
    getClinicsByVeterinarian,
    getUpcomingOwnerAppointments,
    getUpcomingVetAppointments,
    findPetByOwnerAndName,
} from "../api/api.ts";
import { isAdmin, isPetOwner, isVeterinarian } from "../api/roles.ts";
import Confirm from "../components/Confirm.tsx";
import { useNavigate } from "react-router-dom";
import ErrorToast from "../components/ErrorToast.tsx";
import SuccessToast from "../components/SuccessToast.tsx";
import { Mail, Phone, Building2, Edit2, Trash2, Save, X, User, ChevronRight } from "lucide-react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCalendar} from "@fortawesome/free-regular-svg-icons";
import {faBuilding, faStethoscope, faUser} from "@fortawesome/free-solid-svg-icons";

function initials(user) {
    const f = user?.firstName?.[0] ?? "";
    const l = user?.lastName?.[0] ?? "";
    return (f + l).toUpperCase() || user?.username?.[0]?.toUpperCase() || "?";
}

function roleBadge(roles) {
    if (isVeterinarian(roles))
        return <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-200 text-blue-700">VETERINAR</span>;
    if (isPetOwner(roles))
        return <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-green-200 text-green-700">PROPRIETAR</span>;
    return <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-200 text-amber-700">ADMIN</span>;
}


function AppointmentRow({ app, navigate, asVet = false }) {
    return (
        <div
            className="flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-colors"
            style={{ border: "1px solid #f1f5f9" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            onClick={() => { sessionStorage.setItem("appointmentId", app.id.toString()); navigate("/appointments/details"); }}
        >
            <div className="flex-shrink-0 flex items-center justify-center rounded-full text-lg"
                style={{ width: 36, height: 36, background: "#e1f5ee" }}>
                🐾
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 m-0 truncate" style={{ fontSize: 14 }}>
                    {app.pet?.name ?? "-"}
                    <span className="font-normal text-slate-400 ml-1" style={{ fontSize: 12 }}>({app.pet?.breed?.name ?? ""})</span>
                </p>
                <div className="flex gap-3 flex-wrap mt-3" style={{ fontSize: 12, color: "#64748b" }}>
                    <span><FontAwesomeIcon icon={faCalendar}/> {app.slot ? app.slot : '-'}</span>
                    {asVet
                        ? <span><FontAwesomeIcon icon={faUser} /> {app.pet?.owner?.firstName} {app.pet?.owner?.lastName}</span>
                        : <span><FontAwesomeIcon icon={faStethoscope} /> {app.vet?.firstName} {app.vet?.lastName}</span>}
                    {app.clinic && <span><FontAwesomeIcon icon={faBuilding} /> {app.clinic.name}</span>}
                </div>
            </div>
        </div>
    );
}

function AppointmentsCard({ title, appointments, navigate, asVet = false, onViewAll }) {
    return (
        <div className="rounded-2xl bg-white h-full flex flex-col" style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="font-bold text-slate-900 m-0" style={{ fontSize: 16 }}>{title}</h2>
                <button onClick={onViewAll}
                    className="bg-transparent border-none cursor-pointer text-xs font-medium"
                    style={{ color: "#1d9e75" }}>
                    Vezi toate →
                </button>
            </div>
            <div className="px-3 pb-4 flex-1 flex flex-col gap-2">
                {appointments.length === 0
                    ? <p className="text-center text-slate-400 py-6 m-0" style={{ fontSize: 13 }}>Nu există programări viitoare</p>
                    : appointments.map((app) => (
                        <AppointmentRow key={app.id} app={app} navigate={navigate} asVet={asVet} />
                    ))
                }
            </div>
        </div>
    );
}

function PetRow({ pet, navigate, auth }) {
    return (
        <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
            style={{ borderBottom: "1px solid #f1f5f9" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            onClick={() => navigate(`/pets/${auth.user.username}/${pet.name}`)}
        >
            <div className="flex-shrink-0 flex items-center justify-center rounded-full text-lg"
                style={{ width: 36, height: 36, background: "#e1f5ee", border: "1px solid #a7f3d0" }}>
                🐾
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 m-0" style={{ fontSize: 14 }}>{pet.name}</p>
                <p className="text-slate-400 m-0" style={{ fontSize: 12 }}>
                    {pet.breed?.name ?? pet.type?.name ?? "-"}
                    {pet.age != null && ` • ${pet.age} ani`}
                    {pet.gender && ` • ${pet.gender === "MALE" ? "Mascul" : "Femelă"}`}
                </p>
            </div>
            <ChevronRight size={16} color="#cbd5e1" />
        </div>
    );
}

export default function Profile() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const [edit, setEdit] = useState(false);
    const [email, setEmail] = useState(auth.user.email || "");
    const [phone, setPhone] = useState(auth.user.phoneNumber || "");
    const [lastName, setLastName] = useState(auth.user.lastName || "");
    const [firstName, setFirstName] = useState(auth.user.firstName || "");
    const [error, setError] = useState<string | null>(null);

    const [clinics, setClinics] = useState([]);
    const [ownerApps, setOwnerApps] = useState([]);
    const [vetApps, setVetApps] = useState([]);
    const [pets, setPets] = useState([]);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showError, setShowError] = useState(false);
    const [deletionError, setDeletionError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const [pendingRequest, setPendingRequest] = useState(auth.user.pendingRequest ?? false);

    const isVet = isVeterinarian(auth.user.roles);
    const isAdm = isAdmin(auth.user.roles);

    useEffect(() => {
        getClinicsByVeterinarian(auth.user.username).then(setClinics).catch(() => {});
        getUpcomingOwnerAppointments(auth.token, 5).then(setOwnerApps).catch(() => {});
        if (isVet) getUpcomingVetAppointments(auth.token, 5).then(setVetApps).catch(() => {});
        findPetByOwnerAndName(auth.token, auth.user.username).then(setPets).catch(() => {});
    }, [auth.token]);

    async function saveEdit() {
        if (phone !== "" && !/^\d{10}$/.test(phone)) {
            setError("Numărul de telefon trebuie să conțină exact 10 cifre.");
            return;
        }
        try {
            const updated = await updateData(auth.token, {
                id: auth.user.id,
                username: auth.user.username,
                email,
                phoneNumber: phone,
                lastName,
                firstName,
            });
            auth.setUser(updated);
            setError(null);
            setEdit(false);
            setShowSuccess(true);
        } catch (err) {
            setError(err.message);
        }
    }

    async function deleteAccount() {
        try {
            await deleteUser(auth.token, auth);
            auth.logout();
        } catch (err) {
            setDeletionError(err.message);
            setShowError(true);
        }
    }

    async function handleVetRequest() {
        try {
            const res = await fetch(
                `http://localhost:8081/api/users/${auth.user.id}/request-role-change`,
                { method: "PUT", headers: { Authorization: `Bearer ${auth.token}` } }
            );
            const updated = await res.json();
            setPendingRequest(updated.pendingRequest);
        } catch (err) { console.error(err.message); }
    }


    const userCard = (
        <div className="rounded-2xl bg-white flex flex-col" style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-4 p-6">
                <div>
                    <div className="flex items-center justify-center rounded-full font-bold text-white"
                        style={{ width: 72, height: 72, background: "#1d9e75", fontSize: 24 }}>
                        {initials(auth.user)}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900" style={{ fontSize: 20 }}>
                            {auth.user.firstName || auth.user.lastName
                                ? `${auth.user.firstName ?? ""} ${auth.user.lastName ?? ""}`.trim()
                                : auth.user.username}
                        </span>
                        {roleBadge(auth.user.roles)}
                    </div>
                    <p className="text-slate-400 m-0" style={{ fontSize: 13 }}>@{auth.user.username}</p>
                    {isVet && clinics.length > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <Building2 size={12} color="#94a3b8" />
                            <span className="text-slate-400 truncate" style={{ fontSize: 12 }}>
                                {clinics.map(c => c.name).join(", ")}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", margin: "0 24px" }} />

            <div className="px-6 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 w-24">
                    <Mail size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                    {edit
                        ? <input value={email} onChange={e => setEmail(e.target.value)}
                            className="flex-1 rounded-lg px-3 py-1.5"
                            style={{ border: "1.5px solid #d1fae5", outline: "none", fontSize: 14, color: "#0f172a", background: "#f8fafc" }}
                            onFocus={e => (e.currentTarget.style.borderColor = "#1d9e75")}
                            onBlur={e => (e.currentTarget.style.borderColor = "#d1fae5")} />
                        : <span className="text-slate-700" style={{ fontSize: 14 }}>{auth.user.email || "—"}</span>}
                </div>
                <div className="flex items-center gap-3 w-24">
                    <Phone size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                    {edit
                        ? <input value={phone} onChange={e => setPhone(e.target.value)}
                            className="flex-1 rounded-lg px-3 py-1.5"
                            style={{ border: "1.5px solid #d1fae5", outline: "none", fontSize: 14, color: "#0f172a", background: "#f8fafc" }}
                            onFocus={e => (e.currentTarget.style.borderColor = "#1d9e75")}
                            onBlur={e => (e.currentTarget.style.borderColor = "#d1fae5")} />
                        : <span className="text-slate-700" style={{ fontSize: 14 }}>{auth.user.phoneNumber || "—"}</span>}
                </div>
                {edit && (
                    <div className="flex items-center gap-3">
                        <User size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                        <div className="flex flex-col gap-1">
                        <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prenume"
                            className="flex-1 rounded-lg px-3 py-1.5"
                            style={{ border: "1.5px solid #d1fae5", outline: "none", fontSize: 14, color: "#0f172a", background: "#f8fafc" }}
                            onFocus={e => (e.currentTarget.style.borderColor = "#1d9e75")}
                            onBlur={e => (e.currentTarget.style.borderColor = "#d1fae5")} />
                        <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nume"
                            className="flex-1 rounded-lg px-3 py-1.5"
                            style={{ border: "1.5px solid #d1fae5", outline: "none", fontSize: 14, color: "#0f172a", background: "#f8fafc" }}
                            onFocus={e => (e.currentTarget.style.borderColor = "#1d9e75")}
                            onBlur={e => (e.currentTarget.style.borderColor = "#d1fae5")} />
                        </div>
                    </div>
                )}
                {error && <p className="m-0" style={{ fontSize: 12, color: "#dc2626" }}>{error}</p>}
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", margin: "0 24px" }} />

            <div className="px-6 py-4 flex gap-3 flex-wrap justify-content-between">
                {!edit ? (<>
                    <button onClick={() => setEdit(true)}
                            className="flex items-center gap-2 rounded-xl cursor-pointer px-4 py-2 text-sm font-semibold transition-colors bg-emerald-500 hover:bg-emerald-600 text-white">
                        <Edit2 size={14} /> Editare
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 rounded-xl cursor-pointer px-4 py-2 text-sm font-semibold transition-colors bg-red-500 hover:bg-red-600 text-white">
                        <Trash2 size={14} /> Ștergere cont
                    </button>
                </>) : (<>
                    <button onClick={saveEdit}
                        className="flex items-center gap-2 rounded-xl border-none cursor-pointer px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600">
                        <Save size={14} /> Salvare
                    </button>
                    <button onClick={() => { setEdit(false); setError(null); setEmail(auth.user.email || ""); setPhone(auth.user.phoneNumber || ""); setFirstName(auth.user.firstName || ""); setLastName(auth.user.lastName || ""); }}
                        className="flex items-center gap-2 rounded-xl cursor-pointer px-4 py-2 text-sm font-semibold hover:bg-slate-200 border">
                        <X size={14} /> Renunțare
                    </button>
                </>)}
            </div>
        </div>
    );

    const topRightCard = isVet
        ? <AppointmentsCard title="Programări ca medic" appointments={vetApps} navigate={navigate} asVet={true} onViewAll={() => navigate("/appointments")} />
        : <AppointmentsCard title="Programări viitoare" appointments={ownerApps} navigate={navigate} asVet={false} onViewAll={() => navigate("/appointments")} />;

    const petsCard = (
        <div className="rounded-2xl bg-white flex flex-col h-full" style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="font-bold text-slate-900 m-0" style={{ fontSize: 16 }}>Animalele mele</h2>
                <button onClick={() => navigate(`/pets/${auth.user.username}`)}
                    className="bg-transparent border-none cursor-pointer text-xs font-medium"
                    style={{ color: "#1d9e75" }}>
                    Vezi toate →
                </button>
            </div>
            <div className="flex-1 flex flex-col" style={{ overflowY: "auto", maxHeight: 280 }}>
                {pets.length === 0
                    ? <p className="text-center text-slate-400 py-6 m-0 px-5" style={{ fontSize: 13 }}>Niciun animal înregistrat</p>
                    : pets.map(pet => <PetRow key={pet.id} pet={pet} navigate={navigate} auth={auth} />)
                }
            </div>
            <div className="px-5 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                <button onClick={() => navigate(`/pets/${auth.user.username}`)}
                    className="flex items-center gap-1.5 w-full justify-center rounded-xl border-none cursor-pointer px-4 py-2 text-sm font-semibold transition-colors"
                    style={{ background: "transparent", color: "#1d9e75", border: "1.5px dashed #a7f3d0" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf9")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    + Adaugă un animal
                </button>
            </div>
        </div>
    );

    const bottomRightCard = isVet
        ? <AppointmentsCard title="Programări ca proprietar" appointments={ownerApps} navigate={navigate} asVet={false} onViewAll={() => navigate("/appointments")} />
        : (
            <>
                {!isAdm ?
            <div className="rounded-2xl flex flex-col overflow-hidden"
                style={{ border: "1px solid #e2e8f0", background: "linear-gradient(135deg, #f0fdf9 0%, #ecfdf5 100%)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", minHeight: 220 }}>
                <div className="flex flex-col gap-3 p-6 flex-1">
                    <div className="flex items-center justify-center rounded-full"
                        style={{ width: 44, height: 44, background: "#d1fae5", border: "1px solid #a7f3d0" }}>
                        <span style={{ fontSize: 20 }}>🩺</span>
                    </div>
                    <h2 className="font-bold text-slate-900 m-0" style={{ fontSize: 16 }}>Devino medic veterinar</h2>
                    <p className="text-slate-500 m-0" style={{ fontSize: 13, lineHeight: 1.6 }}>
                        Poți solicita acces la funcționalitățile destinate medicilor veterinari.
                        {!pendingRequest && " Solicitarea ta va fi analizată de echipa noastră."}
                    </p>
                    {pendingRequest
                        ? <p className="text-slate-400 m-0 italic" style={{ fontSize: 13 }}>Solicitare în curs de validare…</p>
                        : (
                            <button onClick={handleVetRequest}
                                className="mt-auto rounded-xl border-none cursor-pointer px-5 py-2.5 text-sm font-semibold text-white w-fit transition-colors"
                                style={{ background: "#1d9e75", boxShadow: "0 2px 8px rgba(29,158,117,0.25)" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#166b50")}
                                onMouseLeave={e => (e.currentTarget.style.background = "#1d9e75")}>
                                Trimite solicitare
                            </button>
                        )
                    }
                </div>
            </div>
                    : <></>
                }
            </>
        );

    return (
        <div className="p-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 m-0">Profilul meu</h1>
                <p className="text-slate-400 m-0 mt-1" style={{ fontSize: 14 }}>Vezi și gestionează informațiile contului tău.</p>
            </div>

            <div className={!isAdm ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-3 gap-3'} style={{ alignItems: "start" }}>
                {userCard}
                {topRightCard}
                {petsCard}
                {bottomRightCard}
            </div>

            <Confirm
                open={showDeleteConfirm}
                close={() => setShowDeleteConfirm(false)}
                confirm={deleteAccount}
                message="Ești sigur că dorești ștergerea contului? Această acțiune este ireversibilă."
            />
            <SuccessToast show={showSuccess} close={() => setShowSuccess(false)} message="Datele au fost salvate cu succes!" />
            <ErrorToast close={() => setShowError(false)} show={showError} message={deletionError} />
        </div>
    );
}
