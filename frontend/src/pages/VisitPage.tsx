import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import { useNavigate, useParams } from "react-router-dom";
import {
    fetchChatEntries,
    filterPets,
    findUserByUsername,
    getClinicsByVeterinarian
} from "../api/api.ts";
import { isAdmin, isPetOwner, isVeterinarian } from "../api/roles.ts";
import { Mail, Phone, Building2, ChevronRight, MessageSquare } from "lucide-react";

function initials(u) {
    const f = u?.firstName?.[0] ?? "";
    const l = u?.lastName?.[0] ?? "";
    return (f + l).toUpperCase() || u?.username?.[0]?.toUpperCase() || "?";
}

function RoleBadge({ roles }: { roles: string[] }) {
    if (isVeterinarian(roles))
        return <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "#dbeafe", color: "#1d4ed8" }}>Medic veterinar</span>;
    if (isPetOwner(roles))
        return <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "#d1fae5", color: "#065f46" }}>Client</span>;
    return <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "#fef9c3", color: "#713f12" }}>Admin</span>;
}

export default function Visit() {
    const auth = useContext(AuthContext);
    const { username } = useParams();
    const navigate = useNavigate();

    const [visitedUser, setVisitedUser] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [pets, setPets] = useState([]);
    const [questions, setQuestions] = useState([]);

    const canSeePets = isAdmin(auth.user.roles) || isVeterinarian(auth.user.roles);
    const canSeeQuestions = isAdmin(auth.user.roles) || isVeterinarian(auth.user.roles) || auth.user.username === username;

    useEffect(() => {
        if (auth.user.username === username) { navigate("/profile"); return; }

        findUserByUsername(auth.token, username)
            .then(setVisitedUser)
            .catch(() => navigate("/access-denied"));

        getClinicsByVeterinarian(username).then(setClinics).catch(() => {});

        if (canSeePets) {
            filterPets(auth.token, username, null, null, null).then(setPets).catch(() => {});
        }
        if (canSeeQuestions) {
            fetchChatEntries(auth.token, username, null, null).then(setQuestions).catch(() => {});
        }
    }, [username]);

    if (!visitedUser) return null;

    const isVet = isVeterinarian(visitedUser.roles);

    return (
        <div className="p-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 m-0">Profil utilizator</h1>
                <p className="text-slate-400 m-0 mt-1" style={{ fontSize: 14 }}>@{visitedUser.username}</p>
            </div>

            <div className="grid grid-cols-2 gap-5" style={{ alignItems: "start" }}>

                <div className="rounded-2xl bg-white flex flex-col" style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div className="flex items-center gap-4 p-6">
                        <div className="flex items-center justify-center rounded-full font-bold text-white flex-shrink-0"
                            style={{ width: 72, height: 72, background: "#1d9e75", fontSize: 24 }}>
                            {initials(visitedUser)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900" style={{ fontSize: 20 }}>
                                    {visitedUser.firstName || visitedUser.lastName
                                        ? `${visitedUser.firstName ?? ""} ${visitedUser.lastName ?? ""}`.trim()
                                        : visitedUser.username}
                                </span>
                                <RoleBadge roles={visitedUser.roles} />
                            </div>
                            <p className="text-slate-400 m-0" style={{ fontSize: 13 }}>@{visitedUser.username}</p>
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
                        <div className="flex items-center gap-3">
                            <Mail size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                            <span className="text-slate-700" style={{ fontSize: 14 }}>{visitedUser.email || "—"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                            <span className="text-slate-700" style={{ fontSize: 14 }}>{visitedUser.phoneNumber || "—"}</span>
                        </div>
                    </div>

                    {isVet && (
                        <>
                            <div style={{ borderTop: "1px solid #f1f5f9", margin: "0 24px" }} />
                            <div className="px-6 py-4">
                                <button
                                    onClick={() => navigate(`/slots/${visitedUser.username}`)}
                                    className="flex items-center gap-2 rounded-xl cursor-pointer px-4 py-2 text-sm font-semibold transition-colors"
                                    style={{ background: "transparent", color: "#1d9e75", border: "1.5px solid #a7f3d0" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#f0fdf9"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                                    📅 Vezi program
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {canSeePets ? (
                    <div className="rounded-2xl bg-white flex flex-col max-h-full min-h-full" style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                        <div className="flex items-center justify-between px-5 pt-5 pb-3">
                            <h2 className="font-bold text-slate-900 m-0" style={{ fontSize: 16 }}>Animale</h2>
                            <button
                                onClick={() => navigate(`/pets/${visitedUser.username}`)}
                                className="bg-transparent border-none cursor-pointer text-xs font-medium"
                                style={{ color: "#1d9e75" }}>
                                Vezi toate →
                            </button>
                        </div>
                        <div className="flex-1 flex flex-col" style={{ overflowY: "auto", maxHeight: 300 }}>
                            {pets.length === 0
                                ? <p className="text-center text-slate-400 py-8 m-0 px-5" style={{ fontSize: 13 }}>Niciun animal înregistrat</p>
                                : pets.map(pet => (
                                    <div key={pet.id}
                                        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                                        style={{ borderBottom: "1px solid #f1f5f9" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                        onClick={() => navigate(`/pets/${visitedUser.username}/${pet.name}`)}>
                                        <div className="flex items-center justify-center rounded-full text-lg flex-shrink-0"
                                            style={{ width: 36, height: 36, background: "#e1f5ee", border: "1px solid #a7f3d0" }}>
                                            🐾
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 m-0" style={{ fontSize: 14 }}>{pet.name}</p>
                                            <p className="text-slate-400 m-0" style={{ fontSize: 12 }}>
                                                {pet.breed?.name ?? pet.type?.name ?? "—"}
                                                {pet.age != null && ` • ${pet.age} ani`}
                                                {pet.gender && ` • ${pet.gender === "MALE" ? "Mascul" : "Femelă"}`}
                                            </p>
                                        </div>
                                        <ChevronRight size={16} color="#cbd5e1" />
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                ) : (
                    <></>
                )}

                {canSeeQuestions && (
                    <div className="col-span-2 rounded-2xl bg-white flex flex-col"
                        style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                        <div className="flex items-center justify-between px-5 pt-5 pb-3">
                            <div className="flex items-center gap-2">
                                <MessageSquare size={16} color="#1d9e75" />
                                <h2 className="font-bold text-slate-900 m-0" style={{ fontSize: 16 }}>Istoric întrebări AI</h2>
                            </div>
                            <button
                                onClick={() => navigate(`/ask/history/${visitedUser.username}`)}
                                className="bg-transparent border-none cursor-pointer text-xs font-medium"
                                style={{ color: "#1d9e75" }}>
                                Vezi toate →
                            </button>
                        </div>
                        <div className="flex flex-col" style={{ maxHeight: 320, overflowY: "auto" }}>
                            {questions.length === 0
                                ? <p className="text-center text-slate-400 py-8 m-0" style={{ fontSize: 13 }}>Nu există întrebări înregistrate</p>
                                : questions.slice(0, 8).map(q => (
                                    <div key={q.id}
                                        className="flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors"
                                        style={{ borderBottom: "1px solid #f1f5f9" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                        onClick={() => {
                                            sessionStorage.setItem("questionId", q.id.toString());
                                            navigate(`/ask/history/${visitedUser.username}/details`);
                                        }}>
                                        <div className="flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                                            style={{ width: 28, height: 28, background: "#e1f5ee" }}>
                                            <MessageSquare size={13} color="#1d9e75" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 m-0 truncate" style={{ fontSize: 14 }}>{q.question}</p>
                                            {q.pet?.name && (
                                                <p className="text-slate-400 m-0 mt-0.5" style={{ fontSize: 12 }}>
                                                    🐾 {q.pet.name}
                                                    {q.createdAt && ` · ${new Date(q.createdAt).toLocaleDateString("ro-RO")}`}
                                                </p>
                                            )}
                                        </div>
                                        <ChevronRight size={16} color="#cbd5e1" style={{ flexShrink: 0 }} />
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
