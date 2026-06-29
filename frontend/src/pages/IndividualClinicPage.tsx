import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import { deleteClinic, editClinic, getClinicById, joinClinic, leaveClinic } from "../api/api.ts";
import { isAdmin, isVeterinarian } from "../api/roles.ts";
import Confirm from "../components/Confirm.tsx";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBuilding} from "@fortawesome/free-regular-svg-icons";

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex justify-content-between mt-3 pb-2" style={{ borderBottom: "1px solid #f0f8ff" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                {label}
            </span>
            <span style={{ fontSize: 14, color: "#334155", fontWeight: 500 }}>{children}</span>
        </div>
    );
}


export default function IndividualClinic() {
    const auth = useContext(AuthContext);
    const params = useParams();
    const [clinic, setClinic] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showJoinConfirm, setShowJoinConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const fetchClinic = async () => {
            try { setClinic(await getClinicById(params.id)); } catch (err) { console.log(err); }
        };
        fetchClinic();
    }, [params]);

    async function handleSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
            const res = await editClinic(auth.token, {
                id: clinic.id,
                name: fd.get("name"),
                address: fd.get("address"),
                phoneNumber: fd.get("phone"),
                vets: [],
            });
            setClinic(res);
            setIsEditing(false);
            setSuccessMessage("Datele au fost salvate cu succes");
            setShowSuccess(true);
            setError(null);
        } catch (err) { setError(err.message); }
    }

    async function handleDelete() {
        try {
            await deleteClinic(auth.token, clinic.id);
            sessionStorage.setItem("deletedClinicId", clinic.id);
            navigate("/clinics");
        } catch (err) { setError(err.message); }
    }

    async function handleJoin() {
        try {
            const res = await joinClinic(auth.token, auth.user.username, clinic.id);
            setClinic(res);
            setSuccessMessage("Asocierea s-a realizat cu succes");
            setShowSuccess(true);
        } catch (err) { setError(err.message); }
    }

    async function handleLeave() {
        try {
            const res = await leaveClinic(auth.token, auth.user.username, clinic.id);
            setClinic(res);
            setSuccessMessage("Ai părăsit clinica cu succes");
            setShowSuccess(true);
        } catch (err) { setError(err.message); }
    }

    const isMember = clinic?.vets?.some(v => v.username === auth.user?.username);

    return (
        <div className="space-y-4">
            <div>
                <button onClick={() => navigate("/clinics")}
                    className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition">
                    ← Înapoi la clinici
                </button>
                <h1 className="text-2xl font-bold text-slate-900 text-center">Detalii clinică</h1>
            </div>

            {!clinic ? (
                <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                </div>
            ) : (
                <div className="mx-auto max-w-2xl">
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-100 p-6">
                            <FontAwesomeIcon icon={faBuilding} size={"2x"} className="text-slate-600"/>
                            <div className="flex-1">
                                {isEditing ? (
                                    <input
                                        form="edit-clinic-form"
                                        name="name"
                                        defaultValue={clinic.name}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                    />
                                ) : (
                                    <h2 className="text-xl font-bold text-slate-800">{clinic.name}</h2>
                                )}
                            </div>
                        </div>

                        <form id="edit-clinic-form" onSubmit={handleSubmit} className="mx-5">
                                <div className="flex flex-col">
                                    <InfoRow label="Adresă">
                                        {isEditing ? (
                                            <textarea
                                                name="address"
                                                defaultValue={clinic.address}
                                                rows={2}
                                                className="rounded-xl border w-fit border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                            />
                                        ) : (
                                            <span className="text-sm text-slate-700">{clinic.address || "—"}</span>
                                        )}
                                    </InfoRow>
                                </div>
                                <div className="flex flex-col">
                                    <InfoRow label="Telefon">
                                    {isEditing ? (
                                        <input
                                            name="phone"
                                            defaultValue={clinic.phoneNumber}
                                            className="w-48 rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                        />
                                    ) : (
                                        <span className="text-sm text-slate-700">{clinic.phoneNumber || "—"}</span>
                                    )}
                                    </InfoRow>
                                </div>
                                <div className="my-3">
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Medici veterinari</span>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {clinic.vets && clinic.vets.length > 0 ? clinic.vets.map(vet => (
                                            <a key={vet.id} href={`/user/${vet.username}`}
                                                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-sm text-slate-700 no-underline hover:bg-emerald-50 hover:text-emerald-700 transition">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                                                    {vet.firstName?.[0] ?? vet.username?.[0]}
                                                </span>
                                                {vet.firstName} {vet.lastName}
                                            </a>
                                        )) : (
                                            <span className="text-sm text-slate-400">Niciun veterinar asociat</span>
                                        )}
                                    </div>
                            </div>
                        </form>

                        <div className="border-t border-slate-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                            {auth.user && isAdmin(auth.user.roles) && (
                                <div className="flex gap-2 w-full justify-content-between">
                                    {!isEditing && (
                                        <div className="flex w-full gap-2 justify-content-between">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(true)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
                                            >
                                                ✎ Editare
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setShowDeleteConfirm(true); }}
                                                className="text-center px-4 py-2 text-sm rounded-xl transition-colors font-semibold bg-red-500 hover:bg-red-600 text-white"
                                            >
                                                🗑 Ștergere
                                            </button>
                                        </div>
                                    )}
                                    {isEditing && (
                                        <div className="flex w-full justify-content-between gap-2">
                                            <button type="submit" form="edit-clinic-form"
                                                className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm font-semibold hover:bg-emerald-700 transition">
                                                Salvare
                                            </button>
                                            <button type="button" onClick={() => setIsEditing(false)}
                                                className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200 border">
                                                Renunțare
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {auth.user && isVeterinarian(auth.user.roles) && (
                                <div className="flex w-full">
                                    {isMember ? (
                                        <div className="flex w-full justify-content-between gap-3">
                                            <span className="text-sm font-medium text-emerald-600">✓ Asociat acestei clinici</span>
                                            <button onClick={() => setShowLeaveConfirm(true)}
                                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition">
                                                Părăsire
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowJoinConfirm(true)}
                                            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition">
                                            Asociere clinică
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Confirm open={showDeleteConfirm} close={() => setShowDeleteConfirm(false)} confirm={handleDelete} message="Doriți să ștergeți această clinică?" />
            <Confirm open={showJoinConfirm} close={() => setShowJoinConfirm(false)} confirm={handleJoin} message="Doriți să vă asociați acestei clinici?" />
            <Confirm open={showLeaveConfirm} close={() => setShowLeaveConfirm(false)} confirm={handleLeave} message="Doriți să părăsiți această clinică?" />
            <SuccessToast show={showSuccess} close={() => setShowSuccess(false)} message={successMessage} />
            <ErrorToast show={!!error} close={() => setError(null)} message={error} />
        </div>
    );
}
