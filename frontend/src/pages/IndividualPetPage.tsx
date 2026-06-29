import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import {
    deletePet, editPet,
    findPetByOwnerAndName,
    findUserByUsername, getAllUsers,
    getAppointmentsByPet,
    getRecordsByPet,
} from "../api/api.ts";
import { useNavigate, useParams } from "react-router-dom";
import type { PetDTO } from "../types.ts";
import Confirm from "../components/Confirm.tsx";
import AddPetForm from "./AddPetForm.tsx";
import { isAdmin, isVeterinarian } from "../api/roles.ts";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";
import moment from "moment";
import {Autocomplete, TextField} from "@mui/material";


function calcAge(birthDate: string | null): string | null {
    if (!birthDate) return null;
    const [d, m, y] = birthDate.split(".").map(Number);
    const birth = new Date(y, m - 1, d);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    const days = now.getDay() - birth.getDay() + 1;
    if (age > 0 && months < 0) age--;
    if (age === 0) {
        if (months === 0) {
            return days + (days === 1 ? ' zi': 'zile');
        }
        else {
            return months + (months === 1 ? ' lună' : ' luni');
        }
    }
    return age + (age === 1 ? ' an' : ' ani');
}

function formatBirthDate(birthDate: string | null): string {
    if (!birthDate) return "—";
    const [d, m] = birthDate.split(".").map(Number);
    const y = birthDate.split(".")[2];
    const months = ["Ian","Feb","Mar","Apr","Mai","Iun","Iul","Aug","Sep","Oct","Nov","Dec"];
    return `${d} ${months[m - 1]} ${y}`;
}

function genderLabel(g: string | null) {
    if (!g) return "—";
    if (g.toUpperCase() === "MALE") return { text: "Mascul", symbol: "♂", color: "#3b82f6", bg: "#eff6ff" };
    if (g.toUpperCase() === "FEMALE") return { text: "Femelă", symbol: "♀", color: "#ec4899", bg: "#fdf2f8" };
    return { text: "Necunoscut", symbol: "○", color: "#64748b", bg: "#f8fafc" };
}

function parseSlot(slot: string) {
    if (!slot) return { date: "—", time: "—" };
    const [datePart, timePart] = slot.split(" ");
    const [day, month, year] = datePart.split(".");
    const months = ["Ian","Feb","Mar","Apr","Mai","Iun","Iul","Aug","Sep","Oct","Nov","Dec"];
    return { date: `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`, time: timePart ?? "" };
}

function AppStatusBadge({ app }) {
    const past = moment(`${app.slot.split(" ")[0].split(".").reverse().join("-")} ${app.slot.split(" ")[1]}`).isSameOrBefore(moment());
    if (app.status.includes("CANCELLED"))
        return <span className="rounded-full bg-red-200 px-2.5 py-1 text-xs font-semibold text-red-500">Anulată</span>;
    if (app.status.includes("BOOKED") && !past)
        return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Programată</span>;
    if (app.done)
        return <span className="rounded-full bg-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-600">Finalizată</span>;
    return <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500">Neefectuată</span>;
}


export default function IndividualPet() {
    const auth = useContext(AuthContext);
    const params = useParams();
    const navigate = useNavigate();

    const [pet, setPet] = useState<PetDTO | null>(null);
    const [appointments, setAppointments] = useState([]);
    const [records, setRecords] = useState([]);
    const [activeTab, setActiveTab] = useState<"appointments" | "records">("appointments");

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [gender, setGender] = useState(null);
    const [reloadCount, setReloadCount] = useState(0);

    const [editing, setEditing] = useState(false);
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState("");

    const canEdit = pet && (pet.owner?.id === auth.user?.id || isAdmin(auth.user?.roles));

    useEffect(() => {
        if (!isAdmin(auth.user.roles) && auth.user.username !== params.username && !isVeterinarian(auth.user.roles)) {
            navigate("/access-denied");
            return;
        }

        const load = async () => {
            if(sessionStorage.getItem("showSuccess")) {
                setSuccessMessage(sessionStorage.getItem("showSuccess") as string);
                setShowSuccess(true);
                sessionStorage.removeItem("showSuccess");
            }
            try {
                await findUserByUsername(auth.token, params.username);
                const pets = await findPetByOwnerAndName(auth.token, params.username, params.petName);
                const found = pets.find((p) => p.name === params.petName);
                if (!found) { navigate("/404"); return; }
                setPet(found);
                setNewUser(found.owner?.username ?? "");
                setGender(genderLabel(found.gender));
                const [apps, recs] = await Promise.allSettled([
                    getAppointmentsByPet(auth.token, found.id),
                    getRecordsByPet(auth.token, found.id),
                ]);
                setAppointments(apps.status === "fulfilled" ? apps.value : []);
                setRecords(recs.status === "fulfilled" ? recs.value : []);
            } catch (err) {
                setError(err.message);
            }
            if (isAdmin(auth.user.roles)) {
                try {
                    const usersRes = await getAllUsers(auth.token, null, null)
                    setUsers(usersRes);
                } catch (err) {
                    setError(err.message);
                }
            }
        };
        load();
    }, [params.username, params.petName, reloadCount]);

    async function handleDelete() {
        try {
            await deletePet(auth.token, pet!.id);
            sessionStorage.setItem("deletedPetId", pet!.id.toString());
            navigate(`/pets/${params.username}`);
        } catch (err) {
            setError(err.message);
        }
    }

    async function loadUsers(usernameString: string) {
        try {
            const filteredUsers = await getAllUsers(auth.token, usernameString, null);
            setUsers(filteredUsers);
        }
        catch (err) {
            setError(err.message);
        }
    }

    async function handleOwnerChange(newOwnerUsername: string) {
        try {
            const newOwner = await findUserByUsername(auth.token, newOwnerUsername);
            if (!newOwner) {
                setError("Utilizatorul nu a fost găsit.");
                return;
            }
            const updatedPet = { ...pet, owner: newOwner };
            const res = await editPet(auth.token, updatedPet);
            setPet(res);
            setEditing(false);
            setSuccessMessage("Proprietarul a fost schimbat cu succes!");
            setShowSuccess(true);
            navigate(`/pets/${newOwner.username}/${res.name}`);
        } catch (err) {
            setError(err.message);
        }
    }

    if (!pet) return (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Se încarcă...</div>
    );

    const age = calcAge(pet.birthDate ?? null);
    const PREVIEW_COUNT = 5;

    return (
        <div className="space-y-5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

            <div>
                <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-1">
                    <button
                        type="button"
                        onClick={() => navigate(`/pets/${params.username}`)}
                        className="hover:text-emerald-600 transition-colors bg-transparent border-none p-0 cursor-pointer"
                        style={{ fontSize: 14, color: "#94a3b8" }}
                    >
                        Animale
                    </button>
                    <span>/</span>
                    <span style={{ color: "#475569" }}>{pet.name}</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mt-3">Detalii animal de companie</h1>
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <div className="rounded-2xl bg-white mt-3 mb-2"
                style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: "28px 32px" }}>
                <div className="flex items-center gap-6 justify-content-between">

                    <div className="flex items-center justify-center rounded-2xl flex-shrink-0 text-4xl"
                        style={{ width: 100, height: 100, background: "#e1f5ee", border: "1.5px solid #a7f3d0" }}>
                        🐾
                    </div>

                    <div className="flex-1 min-w-0 mx-3">
                        <div className="row">
                        <div className="col flex items-center">
                            <div>
                                <h2 className="m-0 font-bold text-slate-900" style={{ fontSize: 24 }}>{pet.name}</h2>
                                <p className="m-0 mt-1" style={{ fontSize: 14, color: "#64748b" }}>
                                    {pet.breed?.name ?? pet.breed?.petType?.name ?? "—"}
                                </p>
                            </div>
                        </div>
                            <div className="col">
                                <div>
                                    <p className="m-0 text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8", letterSpacing: "0.05em" }}>Proprietar</p>
                                    {!editing ?
                                    <p className="mt-1 text-sm font-medium text-slate-700">@{pet.owner?.username ?? params.username}</p>
                                        :
                                        <Autocomplete
                                            className="w-48"
                                            options={users.map(u => u.username)}
                                            value={newUser || null}
                                            onChange={(e, value) => {
                                                console.log(e);
                                                if (value) setNewUser(value);
                                            }}
                                            onInputChange={(e, value) => {
                                                console.log(e);
                                                setNewUser(value);
                                                if (value.length > 0) loadUsers(value);
                                            }}
                                            renderInput={(params) => (
                                                <TextField {...params} placeholder="Cauta utilizator..." size="small" />
                                            )}
                                            noOptionsText="Niciun rezultat"
                                        />
                                    }

                                </div>
                                <div>
                                    <p className="m-0 text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8", letterSpacing: "0.05em" }}>
                                        Data nașterii
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                        {formatBirthDate(pet.birthDate)}
                                        {age != null && <span className="text-slate-400 ml-1">({age})</span>}
                                    </p>
                                </div>
                            </div>
                         <div className="col">
                              <div>
                                        <p className="m-0 text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8", letterSpacing: "0.05em" }}>Gen</p>
                                        <p className="mt-1 text-sm font-medium text-slate-700">{gender.text}</p>
                                    </div>
                                    <div>
                                        <p className="m-0 text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8", letterSpacing: "0.05em" }}>Greutate</p>
                                        <p className="mt-1 text-sm font-medium text-slate-700">{pet.weight !== null ? pet.weight + ' kg' : <em>Necompletat</em>}</p>
                                    </div>
                                </div>
                        </div>

                    </div>

                    {canEdit && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex flex-col items-center">
                                {!editing && <button
                                    type="button"
                                    onClick={() => {if (isAdmin(auth.user.roles)) setEditing(true); else setShowEditModal(true);}}
                                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    ✎ Editare {isAdmin(auth.user.roles) ? "proprietar" : "date"}
                                </button>
                                }
                                {!editing && isAdmin(auth.user.roles) && pet.owner.username === auth.user.username && <button
                                    type="button"
                                    onClick={() => {setShowEditModal(true);}}
                                    className="flex items-center mt-3 gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    ✎ Editare date
                                </button>
                                }
                                {editing && <button
                                    type="button"
                                    onClick={() => {handleOwnerChange(newUser);}}
                                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    Salvare
                                </button>
                                }
                                <button
                                    type="button"
                                    onClick={() => { setShowDeleteConfirm(true); }}
                                    className="text-center mt-3 px-4 py-2 text-sm rounded-xl transition-colors font-semibold bg-red-500 hover:bg-red-600 text-white"
                                >
                                    🗑 Ștergere
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>


            <div className="rounded-2xl bg-white"
                style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

                <div className="flex" style={{ borderBottom: "1px solid #f1f5f9", padding: "0 24px" }}>
                    {([
                        { key: "appointments", label: "Istoric programări" },
                        { key: "records", label: "Istoric rapoarte" },
                    ] as const).map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className="cursor-pointer transition-colors"
                            style={{
                                border: "none", background: "transparent", padding: "14px 0",
                                marginRight: 28, fontSize: 14, fontWeight: 600,
                                color: activeTab === tab.key ? "#1d9e75" : "#94a3b8",
                                borderBottom: activeTab === tab.key ? "2px solid #1d9e75" : "2px solid transparent",
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === "appointments" && (
                    <div>
                        {appointments.length === 0 ? (
                            <div className="py-12 text-center text-sm text-slate-400">
                                Nu există programări înregistrate
                            </div>
                        ) : (
                            <>
                                <table className="w-full">
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            {["Data", "Clinică", "Veterinar", "Status"].map(h => (
                                                <th key={h} className={`${h === 'Status' ? 'text-center' : 'text-left'} px-6 py-3`}
                                                    style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.slice(0, PREVIEW_COUNT).map(app => {
                                            const { date, time } = parseSlot(app.slot);
                                            return (
                                                <tr
                                                    key={app.id}
                                                    onClick={() => {
                                                        if (auth.user.username === app.currentOwner?.username || auth.user.username === app.vet?.username) {
                                                            sessionStorage.setItem("appointmentId", app.id.toString());
                                                            navigate("/appointments/details");
                                                        }
                                                    }}
                                                    className={`${(auth.user.username === app.currentOwner?.username || auth.user.username === app.vet?.username) ? 'cursor-pointer': ''} transition-colors`}
                                                    style={{ borderBottom: "1px solid #f8fafc" }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                                >
                                                    <td className="px-6 py-3.5">
                                                        <span className="text-sm font-medium text-slate-700">{date}</span>
                                                        {time && <span className="text-sm font-medium text-slate-700"> {time}</span>}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-sm text-slate-600">{app.clinic?.name ?? <em>Clinică inactivă</em>}</td>
                                                    <td className="px-6 py-3.5 text-sm text-slate-600">
                                                        {app.vet ? `Dr. ${app.vet.firstName ?? ""} ${app.vet.lastName ?? ""}`.trim() : <em>Utilizator inactiv</em>}
                                                    </td>
                                                    <td className="px-3 py-3.5 text-center"><AppStatusBadge app={app} /></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {appointments.length > PREVIEW_COUNT && (
                                    <div className="px-6 py-4" style={{ borderTop: "1px solid #f1f5f9" }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigate("/appointments");
                                                sessionStorage.setItem("petId", pet.id.toString());
                                                sessionStorage.setItem("petName", pet.name.toString());
                                            }}
                                            className="text-sm font-medium cursor-pointer transition-colors"
                                            style={{ background: "none", border: "none", color: "#1d9e75", padding: 0 }}
                                            onMouseEnter={e => { e.currentTarget.style.color = "#16856a"; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = "#1d9e75"; }}
                                        >
                                            Vezi toate programările →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === "records" && (
                    <div>
                        {records.length === 0 ? (
                            <div className="py-12 text-center text-sm text-slate-400">
                                Nu există rapoarte medicale înregistrate
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        {["Data", "Clinică", "Veterinar"].map(h => (
                                            <th key={h} className="text-left px-6 py-3"
                                                style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map(rec => (
                                        <tr
                                            key={rec.id}
                                            onClick={() => {
                                                sessionStorage.setItem("recordId", rec.id.toString());
                                                navigate("/records/details");
                                            }}
                                            className="cursor-pointer transition-colors"
                                            style={{ borderBottom: "1px solid #f8fafc" }}
                                            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                        >
                                            <td className="px-6 py-3.5 text-sm font-medium text-slate-700">{rec.recordDate ?? "—"}</td>
                                            <td className="px-6 py-3.5 text-sm text-slate-600">{rec.appointment?.clinic?.name ?? <em>Clinică inactivă</em>}</td>
                                            <td className="px-6 py-3.5 text-sm text-slate-600">
                                                {rec.vet ? `Dr. ${rec.vet.firstName ?? ""} ${rec.vet.lastName ?? ""}`.trim() : <em>Utilizator inactiv</em>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            <AddPetForm
                open={showEditModal}
                pet={pet}
                save={(updatedPet) => {
                    setShowEditModal(false);
                    if (updatedPet.name !== pet.name) {
                        sessionStorage.setItem("showSuccess", "Datele au fost salvate cu succes!");
                        navigate(`/pets/${params.username}/${updatedPet.name}`);
                    }
                    else {
                        setReloadCount(p => p + 1);
                        setSuccessMessage("Datele au fost salvate cu succes!");
                        setShowSuccess(true);
                    }
                }}
                close={() => setShowEditModal(false)}
            />

            <Confirm
                open={showDeleteConfirm}
                close={() => setShowDeleteConfirm(false)}
                confirm={handleDelete}
                message={`Doriți să ștergeți animalul "${pet.name}"?`}
            />

            <SuccessToast close={() => setShowSuccess(false)} show={showSuccess} message={successMessage} />
            <ErrorToast close={() => setError(null)} show={!!error} message={error} />
        </div>
    );
}
