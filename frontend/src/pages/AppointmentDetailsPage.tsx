import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import { useNavigate } from "react-router-dom";
import {
    changeAppointmentPet,
    confirmAppointment,
    findPetByOwnerAndName,
    getAppointment,
    getRecordByAppointment, sendEmail,
} from "../api/api.ts";
import { isAdmin, isVeterinarian } from "../api/roles.ts";
import moment from "moment";
import MedicalRecordForm from "./MedicalRecordForm.tsx";
import CancelAppointmentForm from "../components/CancelAppointmentForm.tsx";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";


function parseSlot(slot: string) {
    if (!slot) return { date: "—", time: "—" };
    const [datePart, timePart] = slot.split(" ");
    const [day, month, year] = datePart.split(".");
    const months = ["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie","Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"];
    return { date: `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`, time: timePart ?? "" };
}

function isFuture(slot: string) {
    const [datePart, timePart] = slot.split(" ");
    return moment(`${datePart.split(".").reverse().join("-")} ${timePart}`).isSameOrAfter(moment());
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex mt-3 justify-content-between pb-2 items-center" style={{ borderBottom: "1px solid #f0f8ff" }}>
            <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em"}}>
                {label}
            </span>
            </div>
            <div>
            <span style={{ fontSize: 14, color: "#334155", fontWeight: 500 }}>{children}</span>
            </div>
        </div>
    );
}

function StatusBadge({ status, slot, done }: { status: string; slot: string; done: boolean }) {
    const future = isFuture(slot);
    if (status.includes("CANCELLED"))
        return <span className="rounded-full px-3 py-1 text-sm font-bold bg-red-200 !text-red-700">Anulată</span>;
    if (future)
        return <span className="rounded-full px-3 py-1 text-sm font-bold bg-emerald-100 text-emerald-700">Activă</span>;
    if (done)
        return <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: "#eff6ff", color: "#3b82f6" }}>Efectuată</span>;
    return <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: "#f8fafc", color: "#64748b" }}>Neefectuată</span>;
}


export default function AppointmentDetails() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const appointmentId = parseInt(sessionStorage.getItem("appointmentId") ?? "0");

    const [appointment, setAppointment] = useState(null);
    const [pets, setPets] = useState([]);
    const [record, setRecord] = useState(null);
    const [selectedPetId, setSelectedPetId] = useState<string>("");

    const [isEditingPet, setIsEditingPet] = useState(false);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [closeCount, setCloseCount] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const app = await getAppointment(auth.token, appointmentId);
                setAppointment(app);
                setSelectedPetId(String(app.pet?.id ?? ""));
                if (app.currentOwner) {
                    const ownerPets = await findPetByOwnerAndName(auth.token, app.currentOwner.username);
                    setPets(ownerPets ?? []);
                }
            } catch (err) {
                setError(err.message);
            }
            try {
                const rec = await getRecordByAppointment(auth.token, appointmentId);
                setRecord(rec);
            } catch {
                setRecord(null);
            }
        };
        load();
        const loadPendingNotifications = async () => {
            if (sessionStorage.getItem("sendEmailAppointmentId") !== null) {
                try {
                    await sendEmail(auth.token, sessionStorage.getItem("sendEmailAppointmentId"));
                    sessionStorage.removeItem("sendEmailAppointmentId");
                    console.log("Email trimis");
                }
                catch(err) {
                    setError(err);
                }
            }
        }
        loadPendingNotifications();
    }, [closeCount]);

    if (!appointment) return (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Se încarcă...</div>
    );

    const { date, time } = parseSlot(appointment.slot);
    const future = isFuture(appointment.slot);
    const isCancelled = appointment.status.includes("CANCELLED");
    const isOwner = appointment.pet?.owner?.id === auth.user?.id || appointment.currentOwner?.id === auth.user?.id;
    const isVet = appointment.vet?.id === auth.user?.id;
    const canCancel = (isVet || isOwner) && appointment.status.includes("BOOKED") && future;
    const canConfirm =
        isVeterinarian(auth.user?.roles) &&
        isVet &&
        appointment.status.includes("BOOKED") &&
        !future &&
        !appointment.done &&
        appointment.clinic?.vets?.some((v) => v.id === auth.user?.id);
    const canEditPet =
        (isOwner || isAdmin(auth.user?.roles)) && future && appointment.status.includes("BOOKED");
    const hasRecord = record && record.id !== 0;
    const canAddRecord =
        isVet &&
        appointment.done &&
        appointment.pet &&
        appointment.clinic?.vets?.some((v) => v.id === auth.user?.id) &&
        !hasRecord;

    async function savePetChange() {
        try {
            const res = await changeAppointmentPet(auth.token, appointmentId, selectedPetId);
            setAppointment(res);
            setIsEditingPet(false);
            setSuccessMessage("Animalul a fost actualizat");
            setShowSuccess(true);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleConfirm() {
        try {
            await confirmAppointment(auth.token, appointmentId);
            setCloseCount(p => p + 1);
            setSuccessMessage("Consultația a fost confirmată");
            setShowSuccess(true);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="space-y-5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

            <div>
                <div className="flex items-center gap-1.5 mb-1" style={{ fontSize: 14, color: "#94a3b8" }}>
                    <button
                        type="button"
                        onClick={() => navigate("/appointments")}
                        className="bg-transparent border-none p-0 cursor-pointer transition-colors hover:text-emerald-600"
                        style={{ fontSize: 14, color: "#94a3b8" }}
                    >
                        Programări
                    </button>
                    <span>/</span>
                    <span style={{ color: "#475569" }}>{date}</span>
                </div>
                <div className="flex items-center justify-center my-4 mx-1 gap-2">
                    <h1 className="text-2xl font-bold text-slate-900">Detalii programare</h1>
                    <StatusBadge status={appointment.status} slot={appointment.slot} done={appointment.done} />
                </div>
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <div className="flex justify-content-center">
            <div className="rounded-2xl bg-white col-9"
                style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

                <div className="flex items-center gap-4 px-8 py-6" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <div className="flex items-center justify-center rounded-2xl flex-shrink-0"
                        style={{ width: 56, height: 56, background: "#e1f5ee", border: "1.5px solid #a7f3d0", fontSize: 24 }}>
                        📅
                    </div>
                    <div>
                        <p className="m-0 font-bold text-slate-900" style={{ fontSize: 20 }}>{date}</p>
                        <p className="m-0" style={{ fontSize: 14, color: "#64748b" }}>{time} · 30 min</p>
                    </div>
                </div>

                <div className="mx-5 pb-3"
                    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", borderBottom: "1px solid #f1f5f9" }}>

                    <InfoRow label="Veterinar">
                        {appointment.vet
                            ? `Dr. ${appointment.vet.firstName ?? ""} ${appointment.vet.lastName ?? ""}`.trim()
                            : <em>Utilizator inactiv</em>}
                    </InfoRow>

                    <InfoRow label="Clinică">
                        {appointment.clinic?.name ?? <span style={{ color: "#94a3b8" }}><em>Clinică inactivă</em></span>}
                    </InfoRow>

                    <InfoRow label="Animal">
                        {isEditingPet ? (
                            <div className="flex items-center gap-2 mt-1">
                                <select
                                    value={selectedPetId}
                                    onChange={e => setSelectedPetId(e.target.value)}
                                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                >
                                    {pets.length > 0
                                        ? pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                                        : <option disabled>Niciun animal</option>}
                                </select>
                            </div>
                        ) : (
                            <span className="flex items-center gap-2">
                                {appointment.pet?.name ?? <em>Animal șters</em>}
                            </span>
                        )}
                    </InfoRow>

                    <InfoRow label="Proprietar">
                        @{appointment.currentOwner?.username ?? appointment.pet?.owner?.username ?? <em>Utilizator inactiv</em>}
                    </InfoRow>

                    {appointment.done && hasRecord && (
                        <InfoRow label="Raport medical">
                            <button
                                type="button"
                                onClick={() => { sessionStorage.setItem("recordId", String(record.id)); navigate("/records/details"); }}
                                style={{ background: "none", border: "none", padding: 0, color: "#1d9e75", fontSize: 14, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                            >
                                Vezi raport →
                            </button>
                        </InfoRow>
                    )}

                    {isCancelled && (
                        <>
                            <InfoRow label="Anulat de">
                                {appointment.cancelledBy?.username
                                    ? <span>@{appointment.cancelledBy.username}</span>
                                    : <span><em>Utilizator inactiv</em></span>}
                            </InfoRow>
                            <div className="flex flex-col gap-2 mt-3 pb-2" style={{ borderBottom: "1px solid #f0f8ff" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em"}}>Motiv anulare</span>
                                <span style={{ fontSize: 14, color: "#334155", fontWeight: 500 }}>
                                    {appointment.cancelReason || <span style={{ color: "#94a3b8" }}><em>Motiv necompletat</em></span>}
                                </span>
                            </div>
                        </>
                    )}
                    {appointment.notes && (
                        <div className="flex flex-col gap-2 mt-3">
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em"}}>Note</span>
                            <span style={{ fontSize: 14, color: "#334155", fontWeight: 500 }}>
                                    {appointment.notes}
                                </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-content-between gap-3 flex-wrap px-8 py-3">
                    {canConfirm && !isEditingPet && (
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition cursor-pointer"
                            style={{ background: "#1d9e75", border: "none" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#16856a")}
                            onMouseLeave={e => (e.currentTarget.style.background = "#1d9e75")}
                        >
                            ✓ Confirmă consultația
                        </button>
                    )}

                    {canAddRecord && !isEditingPet && (
                        <button
                            type="button"
                            onClick={() => setShowRecordModal(true)}
                            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer transition"
                            style={{ background: "transparent", border: "1.5px solid #a7f3d0", color: "#1d9e75" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf9")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                            + Adaugă raport medical
                        </button>
                    )}

                    {!isEditingPet && canEditPet && (
                        <button type="button" onClick={() => setIsEditingPet(true)} className="rounded-xl font-semibold px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white transition">
                            ✎ Modificare
                        </button>
                    )}

                    {canCancel && !isEditingPet && (
                        <button
                            type="button"
                            onClick={() => setShowCancelModal(true)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition cursor-pointer"
                            style={{ background: "#dc2626", border: "none" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#b91c1c")}
                            onMouseLeave={e => (e.currentTarget.style.background = "#dc2626")}
                        >
                            Anulare
                        </button>
                    )}

                    {appointment.done && (
                        <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#1d9e75" }}>
                            ✓ Consultație efectuată
                        </span>
                    )}

                    {isEditingPet && <div className="flex justify-content-end gap-2">
                        <button type="button" onClick={savePetChange}
                                className="rounded-lg px-3 py-1.5 font-semibold text-white cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                                >
                            Salvare
                        </button>
                        <button type="button" onClick={() => setIsEditingPet(false)}
                                className="rounded-lg px-3 py-1.5 font-semibold cursor-pointer hover:!bg-slate-200 border">
                            Renunțare
                        </button>
                    </div>}
                </div>
            </div>
            </div>
            <MedicalRecordForm
                open={showRecordModal}
                save={() => {
                    setShowRecordModal(false);
                    setCloseCount(p => p + 1);
                    setSuccessMessage("Raportul a fost creat cu succes");
                    setShowSuccess(true);
                }}
                close={() => setShowRecordModal(false)}
                appointment={appointment}
            />

            <CancelAppointmentForm
                open={showCancelModal}
                slot={appointment}
                save={() => {
                    setShowCancelModal(false);
                    setCloseCount(p => p + 1);
                    setSuccessMessage("Programarea a fost anulată");
                    setShowSuccess(true);
                }}
                close={() => setShowCancelModal(false)}
                showToast={() => {}}
            />

            <SuccessToast close={() => setShowSuccess(false)} show={showSuccess} message={successMessage} />
            <ErrorToast close={() => setError(null)} show={!!error} message={error} />
        </div>
    );
}
