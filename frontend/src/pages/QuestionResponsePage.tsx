import { AuthContext } from "../api/authContext.ts";
import { useContext, useEffect, useState } from "react";
import { approveResponse, deleteQuestion, fetchQuestion, getRecordsByPet } from "../api/api.ts";
import { useNavigate, useParams } from "react-router-dom";
import Confirm from "../components/Confirm.tsx";
import { isAdmin, isVeterinarian } from "../api/roles.ts";
import FormatText from "../FormatText.tsx";

export default function QuestionResponse() {
    const auth = useContext(AuthContext);
    const [error, setError] = useState(null);
    const [entry, setEntry] = useState(null);
    const navigate = useNavigate();
    const params = useParams();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [records, setRecords] = useState([]);
    const [generated, setGenerated] = useState(false);
    const [showCreateConfirm, setShowCreateConfirm] = useState(false);

    async function generateRecord() {
        try {
            await approveResponse(auth.token, entry.id);
            setGenerated(true);
        } catch (err) { setError(err.message); }
    }

    useEffect(() => {
        const fetchEntry = async () => {
            try {
                const res = await fetchQuestion(auth.token, sessionStorage.getItem("questionId"));
                setEntry(res);
                setError(null);
                if (res.pet) {
                    try {
                        const allRecords = await getRecordsByPet(auth.token, res.pet.id);
                        setRecords(allRecords.filter(r => r.vet.id === auth.user.id));
                    } catch (err) { console.log(err.message); setRecords([]); }
                }
            } catch (err) {
                setError(err);
                navigate("/access-denied");
            }
        };
        fetchEntry();
    }, [generated]);

    async function handleDelete() {
        try {
            await deleteQuestion(auth.token, sessionStorage.getItem("questionId"));
            sessionStorage.removeItem("questionId");
            navigate(`/ask/history/${params.username}`);
        } catch (err) { setError(err); }
    }

    const canGenerateRecord = isVeterinarian(auth.user.roles) && records?.length > 0 && entry?.medicalRecord === null && entry?.approvedBy === null;
    const canViewRecord = (isVeterinarian(auth.user.roles) || auth.user.id === entry?.pet?.owner?.id) && entry?.medicalRecord !== null;
    const canDelete = isAdmin(auth.user.roles) || auth.user.username === params.username;

    return (
        <div className="space-y-4">
            <div>
                <button onClick={() => navigate(`/ask/history/${params.username}`)}
                    className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition">
                    ← Înapoi la istoric
                </button>
                <h1 className="text-2xl font-bold text-slate-900 text-center">Detalii întrebare</h1>
            </div>

            {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{String(error)}</div>}

            {!entry ? (
                <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                </div>
            ) : (
                <div className="mx-auto max-w-3xl space-y-2">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
                        <div className="flex items-center gap-4 px-6 py-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl border border-emerald-100">✨</div>
                            <div>
                                <p className="font-semibold text-slate-800">Conversație AI</p>
                                <p className="text-xs text-slate-400">{entry.timestamp}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between px-6 py-3">
                            <span className="text-sm font-medium text-slate-500">Animal de companie</span>
                            <span className="text-sm text-slate-700">
                                {entry.pet?.name}
                                {entry.pet?.owner?.username && (
                                    <span className="ml-1 text-slate-400">(proprietar: {entry.pet.owner.username})</span>
                                )}
                            </span>
                        </div>
                        {entry.medicalRecord && (
                            <div className="flex items-center justify-between px-6 py-3">
                                <span className="text-sm font-medium text-slate-500">Raport generat</span>
                                <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-700">✓ Da</span>
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Întrebare</p>
                        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                            {entry.userMessage}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Răspuns AI</p>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                            <FormatText message={entry.botResponse} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                        <div className="flex gap-2">
                            {canGenerateRecord && (
                                <button onClick={() => setShowCreateConfirm(true)}
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                                    Generare raport
                                </button>
                            )}
                            {canViewRecord && (
                                <button onClick={() => { sessionStorage.setItem("recordId", entry.medicalRecord.id.toString()); navigate("/records/details"); }}
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition">
                                    Vizualizare raport
                                </button>
                            )}
                        </div>
                        {canDelete && (
                            <button onClick={() => setShowDeleteConfirm(true)}
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition">
                                Ștergere
                            </button>
                        )}
                    </div>
                </div>
            )}

            <Confirm open={showDeleteConfirm} close={() => setShowDeleteConfirm(false)} confirm={handleDelete}
                message="Doriți să ștergeți această întrebare din istoric? Acțiunea este ireversibilă." />
            <Confirm open={showCreateConfirm} close={() => setShowCreateConfirm(false)} confirm={generateRecord}
                message="Doriți să generați un raport medical în baza acestui răspuns?" />
        </div>
    );
}
