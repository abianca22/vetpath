import { useContext, useState } from "react";
import { addRecord } from "../api/api.ts";
import { AuthContext } from "../api/authContext.ts";
import ModalShell from "../components/ModalShell.tsx";
import type {AppointmentDTO} from "../types.ts";

export default function MedicalRecordForm({ open, close, save, appointment }: {
    open: boolean;
    close: () => void;
    save: () => void;
    appointment: AppointmentDTO;
}) {
    const auth = useContext(AuthContext);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const recordData = {
            vet: { id: auth.user.id },
            pet: { id: appointment.pet.id },
            appointment: { id: appointment.id },
            symptoms: fd.get("symptoms"),
            diagnosis: fd.get("diagnosis"),
            treatment: fd.get("treatment"),
        };
        try {
            setLoading(true);
            await addRecord(auth.token, recordData);
            setError(null);
            save();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        setError(null);
        close();
    }

    return (
        <ModalShell open={open} onClose={handleClose} title="Adaugă raport medical">
            <div style={{ fontFamily: "Inter, system-ui, sans-serif", width: "100%", maxWidth: 520 }}>

                <div className="flex items-center justify-between px-6 py-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-xl flex-shrink-0 mb-3"
                            style={{ width: 40, height: 40, background: "#e1f5ee", border: "1.5px solid #a7f3d0", fontSize: 18 }}>
                            📋
                        </div>
                        <div>
                            <p className="m-0" style={{ fontSize: 16, color: "black", fontWeight: 600 }}>Completează detaliile consultației</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 flex flex-col gap-2" style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                    <div className="flex items-center justify-between">
                        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Animal</span>
                        <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>
                            {appointment?.pet?.name ?? "—"}
                            {appointment?.pet?.birthDate && (
                                <span style={{ color: "#94a3b8", fontWeight: 400 }}> · {appointment.pet.birthDate}</span>
                            )}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Veterinar</span>
                        <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>
                            {appointment?.vet?.username ?? "—"}
                            {appointment?.clinic?.name && (
                                <span style={{ color: "#94a3b8", fontWeight: 400 }}> · {appointment.clinic.name}</span>
                            )}
                        </span>
                    </div>
                </div>

                <form id="medical-record-form" onSubmit={handleSubmit} className="px-6 py-3 flex flex-col gap-4">
                    {error && (
                        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                    )}

                    {[
                        { name: "symptoms", label: "Simptome", rows: 3 },
                        { name: "diagnosis", label: "Diagnostic", rows: 4 },
                        { name: "treatment", label: "Tratament / Recomandări", rows: 4 },
                    ].map(({ name, label, rows }) => (
                        <div key={name} className="flex flex-col gap-1.5">
                            <label htmlFor={name} className="text-sm font-semibold text-slate-600">{label}</label>
                            <textarea
                                id={name} name={name} rows={rows}
                                className="resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                style={{ lineHeight: 1.6 }}
                            />
                        </div>
                    ))}
                </form>

                <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid #f1f5f9" }}>
                    <button type="button" onClick={handleClose}
                        className="rounded-xl px-5 py-2.5 text-sm font-medium cursor-pointer transition"
                        style={{ background: "transparent", border: "1px solid #e2e8f0", color: "#64748b" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        Anulare
                    </button>
                    <button type="submit" form="medical-record-form" disabled={loading}
                        className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition cursor-pointer disabled:opacity-50"
                        style={{ background: "#1d9e75", border: "none" }}
                        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#16856a"; }}
                        onMouseLeave={e => (e.currentTarget.style.background = "#1d9e75")}>
                        {loading ? (
                            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Se salvează...</>
                        ) : "Salvează raport"}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
