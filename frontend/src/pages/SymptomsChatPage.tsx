import { AuthContext } from "../api/authContext.ts";
import { useContext, useEffect, useRef, useState } from "react";
import { findPetByOwnerAndName, sendQuestion } from "../api/api.ts";
import React from "react";
import { useNavigate } from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTriangleExclamation} from "@fortawesome/free-solid-svg-icons";

function renderAnswer(text: string) {
    return text.split("\n").map((line, i, arr) => {
        const parts = line.split("**");
        return (
            <React.Fragment key={i}>
                {parts.map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                )}
                {i < arr.length - 1 && <br />}
            </React.Fragment>
        );
    });
}

export default function Chat() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const [answer, setAnswer] = useState("");
    const [submittedQuestion, setSubmittedQuestion] = useState("");
    const [submittedPetName, setSubmittedPetName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedPet, setSelectedPet] = useState("");
    const [pets, setPets] = useState([]);
    const [question, setQuestion] = useState("");
    const answerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchPets = async () => {
            try {
                const res = await findPetByOwnerAndName(auth.token, auth.user.username);
                setPets(res);
                setSelectedPet(res.length > 0 ? res[0].id.toString() : "");
            } catch {
                setPets([]);
            }
        };
        fetchPets();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!question.trim()) return;
        const petName = pets.find(p => String(p.id) === selectedPet)?.name ?? "";
        setSubmittedQuestion(question);
        setSubmittedPetName(petName);
        setAnswer("");
        setError(null);
        try {
            setLoading(true);
            const res = await sendQuestion(auth.token, question, selectedPet);
            setAnswer(res);
            setTimeout(() => answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
        } catch (err) {
            setError(err?.message ?? "A apărut o eroare.");
        } finally {
            setLoading(false);
        }
    }

    function handleReset() {
        setAnswer(""); setSubmittedQuestion(""); setSubmittedPetName(""); setQuestion(""); setError(null);
    }

    return (
        <div className="space-y-5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 m-0 mx-2">Asistență AI</h1>
                    <p className="mt-1 text-sm text-slate-400 m-0 mx-2">Descrie simptomele și primește o evaluare inițială pentru animalul tău</p>
                </div>
                <button type="button" onClick={() => navigate(`/ask/history/${auth.user.username}`)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 cursor-pointer"
                    style={{ border: "1px solid #e2e8f0" }}>
                    Istoric întrebări
                </button>
            </div>

            <div className="rounded-2xl flex items-start gap-3 p-3 mb-1 mt-2"
                style={{ background: "#fefce8", border: "1px solid #fde68a" }}>
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-yellow-600" size="lg" />
                <p className="m-0 text-sm" style={{ color: "#92400e", lineHeight: 1.6 }}>
                    <strong>Notă importantă:</strong> Evaluarea este orientativă și <strong>nu înlocuiește consultul unui medic veterinar.</strong>
                </p>
            </div>

            <div className="rounded-2xl bg-white"
                style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <form onSubmit={handleSubmit} className="px-6 py-3">

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-600" htmlFor="pet-select">Animal de companie</label>
                        {pets.length === 0 ? (
                            <p className="text-sm text-slate-400 italic m-0">Nu ai niciun animal înregistrat.</p>
                        ) : (
                            <select id="pet-select" value={selectedPet} onChange={e => setSelectedPet(e.target.value)} required
                                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                style={{ maxWidth: 280 }}>
                                {pets.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}{p.breed?.name ? ` (${p.breed.name})` : ""}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 mt-3">
                        <label className="text-sm font-semibold text-slate-600" htmlFor="question">Simptome observate</label>
                        <textarea id="question" name="question" rows={5} required
                            value={question} onChange={e => setQuestion(e.target.value)}
                            className="resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            style={{ lineHeight: 1.6 }} />
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                        <button type="submit" disabled={loading || pets.length === 0}
                            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition cursor-pointer disabled:opacity-50"
                            style={{ background: "#1d9e75", border: "none" }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#16856a"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#1d9e75"; }}>
                            {loading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    Se procesează...
                                </>
                            ) : <>✨ Trimite întrebarea</>}
                        </button>
                        {(answer || submittedQuestion) && (
                            <button type="button" onClick={handleReset}
                                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition cursor-pointer"
                                style={{ background: "transparent", border: "1px solid #e2e8f0" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                                Întrebare nouă
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {(loading || answer || error) && (
                <div ref={answerRef} className="rounded-2xl bg-white"
                    style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

                    <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center rounded-xl text-base flex-shrink-0"
                                style={{ width: 36, height: 36, background: "#e1f5ee", border: "1px solid #a7f3d0" }}>
                                ✨
                            </div>
                            <div>
                                <p className="m-0 font-semibold text-slate-800" style={{ fontSize: 14 }}>Răspuns AI</p>
                                {submittedPetName && (
                                    <p className="m-0" style={{ fontSize: 12, color: "#94a3b8" }}>pentru 🐾 {submittedPetName}</p>
                                )}
                            </div>
                        </div>
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ background: "#fef9c3", color: "#92400e" }}>
                            Evaluare orientativă
                        </span>
                    </div>

                    {submittedQuestion && (
                        <div className="px-6 py-4" style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                            <p className="m-0 text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#94a3b8", letterSpacing: "0.06em" }}>
                                Întrebarea ta
                            </p>
                            <p className="m-0 text-sm text-slate-600" style={{ lineHeight: 1.6 }}>{submittedQuestion}</p>
                        </div>
                    )}

                    <div className="px-6 py-5">
                        {loading ? (
                            <div className="flex items-center gap-3 text-slate-400">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
                                <span className="text-sm">Se generează evaluarea...</span>
                            </div>
                        ) : error ? (
                            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                        ) : (
                            <div className="text-sm text-slate-700" style={{ lineHeight: 1.8 }}>
                                {renderAnswer(answer)}
                            </div>
                        )}
                    </div>

                    {answer && !loading && (
                        <div className="px-6 py-4" style={{ borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
                            <p className="m-0 text-xs text-slate-400" style={{ lineHeight: 1.5 }}>
                                🩺 Această evaluare este generată automat și are caracter informativ. Consultați un medic veterinar pentru un diagnostic corect.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
