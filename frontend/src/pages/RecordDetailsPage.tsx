import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import { useNavigate } from "react-router-dom";
import { deleteRecord, editRecord, getQuestionByRecord, getRecordById } from "../api/api.ts";
import { isAdmin } from "../api/roles.ts";
import Confirm from "../components/Confirm.tsx";
import FormatText from "../FormatText.tsx";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBookMedical} from "@fortawesome/free-solid-svg-icons";

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex justify-content-between mt-3 pb-2" style={{ borderBottom: "1px solid #f0f8ff" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
            </span>
            <span style={{ fontSize: 14, color: "#334155", fontWeight: 500 }}>{children}</span>
        </div>
    );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5 pb-2 mt-3" style={{ borderBottom: "1px solid #f0f8ff"}}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
            </span>
            <div className="mx-2" style={{ fontSize: 14, color: "#334155", lineHeight: 1.7 }}>{children}</div>
        </div>
    );
}

export default function RecordDetails() {
    const auth = useContext(AuthContext);
    const recordId = parseInt(sessionStorage.getItem("recordId"));
    const [record, setRecord] = useState(null);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [chatEntry, setChatEntry] = useState(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const recordData = {
            symptoms: fd.get("symptoms"),
            diagnosis: fd.get("diagnosis"),
            treatment: fd.get("treatment"),
            pet: { id: record?.pet?.id },
            vet: { id: record?.vet?.id },
            recordDate: record?.recordDate,
            appointment: { id: record?.appointment?.id },
        };
        try {
            const res = await editRecord(auth.token, record.id, recordData);
            setRecord(res);
            setIsEditing(false);
            setError(null);
            setShowSuccess(true);
        } catch (err) { setError(err.message); setShowError(true); }
    }

    async function handleDelete() {
        try {
            await deleteRecord(auth.token, recordId);
            sessionStorage.removeItem("recordId");
            navigate("/records");
        } catch (err) { setError(err.message); setShowError(true); }
    }

    useEffect(() => {
        const fetchRecord = async () => {
            try {
                const res = await getRecordById(auth.token, recordId);
                setRecord(res);
                setError(null);
                try { setChatEntry(await getQuestionByRecord(auth.token, recordId)); }
                catch { setChatEntry(null); }
            } catch (err) { setError(err.message); setShowError(true); }
        };
        fetchRecord();
    }, []);

    const canEdit = record && (
        (record.vet?.id === auth.user.id &&
            (record?.appointment?.clinic?.vets?.some((v) => v.id === auth.user.id) ||
                (chatEntry && chatEntry.approvedBy?.id === auth.user.id)))
        || isAdmin(auth.user.roles)
    );

    return (
        <div className="space-y-5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            <div>
                <div className="flex items-center gap-1.5 mb-1" style={{ fontSize: 14, color: "#94a3b8" }}>
                    <button
                        type="button"
                        onClick={() => navigate("/records")}
                        className="bg-transparent border-none p-0 cursor-pointer transition-colors hover:text-emerald-600"
                        style={{ fontSize: 14, color: "#94a3b8" }}
                    >
                        Rapoarte medicale
                    </button>
                    <span>/</span>
                    <span style={{ color: "#475569" }}>
                        {record ? `Raport #${record.id}` : "…"}
                    </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 m-3 text-center">Raport medical</h1>
            </div>

            {!record ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                </div>
            ) : (
                <form id="edit-record-form" onSubmit={handleSubmit}>
                    <div className="row flex justify-content-center">
                    <div className="rounded-2xl bg-white col-9"
                        style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

                        <div className="flex items-center gap-4 px-8 py-6" style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <FontAwesomeIcon icon={faBookMedical} className="text-emerald-600" size="2x" />
                            <div>
                                <p className="m-0 font-bold text-slate-900" style={{ fontSize: 20 }}>
                                    Raport #{record.id}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col mx-5">
                            <InfoRow label="Animal">
                                {record.pet?.name ?? <em>Animal șters</em>}
                            </InfoRow>

                            <InfoRow label="Proprietar">
                                {record.pet?.owner ? '@' : ''}
                                {record.appointment?.currentOwner.username ?? <em>Utilizator dezactivat</em>}
                            </InfoRow>

                            <InfoRow label="Veterinar">
                                {record.vet?.username
                                    ? `Dr. ${record.vet.firstName ?? record.vet.username} ${record.vet.lastName ?? ""}`.trim()
                                    : <em>Utilizator dezactivat</em>}
                            </InfoRow>

                            {record.appointment !== null &&
                            <InfoRow label="Clinică">
                                {record.appointment?.clinic?.name ?? <em>Clinică dezactivată</em>}
                            </InfoRow>
                            }

                            {record.appointment?.slot && (
                                <InfoRow label="Data programării">
                                    {record.appointment.slot}
                                </InfoRow>
                            )
                            }

                            {record.recordDate && (
                                <InfoRow label="Adăugat la">
                                    {record.recordDate}
                                </InfoRow>
                            )
                            }
                            </div>

                        <div className="flex flex-col px-8 mx-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <Section label="Simptome">
                                {isEditing ? (
                                    <textarea name="symptoms" defaultValue={record.symptoms !== "none" ? record.symptoms : ""}
                                        rows={3} className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                                ) : record.symptoms && record.symptoms !== "none"
                                    ? <span className="whitespace-pre-line">{record.symptoms}</span>
                                    : <span style={{ color: "#94a3b8", fontStyle: "italic"}} className="font-semibold">Necompletat</span>
                                }
                            </Section>

                            <Section label="Diagnostic">
                                {isEditing ? (
                                    <textarea name="diagnosis" defaultValue={record.diagnosis}
                                        rows={4} className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                                ) : record.diagnosis
                                    ? <FormatText message={record.diagnosis} />
                                    : <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Necompletat</span>
                                }
                            </Section>

                            <Section label="Tratament / Recomandări">
                                {isEditing ? (
                                    <textarea name="treatment" defaultValue={record.treatment}
                                        rows={4} className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                                ) : record.treatment
                                    ? <span className="whitespace-pre-line">{record.treatment}</span>
                                    : <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Necompletat</span>
                                }
                            </Section>
                        </div>

                        {canEdit && (
                            <div className="flex items-center gap-3 flex-wrap px-8 py-5">
                                {!isEditing && record.pet && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer transition"
                                        style={{ background: "transparent", border: "1.5px solid #a7f3d0", color: "#1d9e75" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf9")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                    >
                                        ✎ Editează raport
                                    </button>
                                )}
                                {isEditing && (
                                    <>
                                        <button
                                            type="submit"
                                            form="edit-record-form"
                                            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition cursor-pointer"
                                            style={{ background: "#1d9e75", border: "none" }}
                                            onMouseEnter={e => (e.currentTarget.style.background = "#16856a")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "#1d9e75")}
                                        >
                                            ✓ Salvează
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="rounded-xl px-5 py-2.5 text-sm font-medium cursor-pointer transition"
                                            style={{ background: "transparent", border: "1px solid #e2e8f0", color: "#64748b" }}
                                            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                        >
                                            Anulare
                                        </button>
                                    </>
                                )}
                                {!isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition cursor-pointer"
                                        style={{ background: "#dc2626", border: "none" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#b91c1c")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "#dc2626")}
                                    >
                                        Șterge raport
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    </div>
                </form>
            )}

            <Confirm open={showDeleteConfirm} close={() => setShowDeleteConfirm(false)} confirm={handleDelete}
                message="Doriți să ștergeți acest raport medical?" />
            <SuccessToast close={() => setShowSuccess(false)} show={showSuccess} message="Raportul a fost modificat cu succes!" />
            <ErrorToast close={() => setShowError(false)} show={showError} message={error} />
        </div>
    );
}
