import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import { useNavigate, useParams } from "react-router-dom";
import { fetchChatEntries, findPetByOwnerAndName } from "../api/api.ts";
import Pagination from "../components/Pagination.tsx";

const PAGE_SIZE = 10;

export default function ChatEntries() {
    const auth = useContext(AuthContext);
    const params = useParams();
    const [entries, setEntries] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [selectedPet, setSelectedPet] = useState("");
    const [pets, setPets] = useState([]);
    const [lastKeyword, setLastKeyword] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchEntries = async () => {
            try {
                setEntries(await fetchChatEntries(auth.token, params.username, null, null));
            } catch (err) {
                setError(err);
                navigate("/access-denied");
            }
        };
        const fetchPets = async () => {
            try { setPets(await findPetByOwnerAndName(auth.token, params.username)); }
            catch (err) { setError(err); }
        };
        fetchEntries();
        fetchPets();
    }, [params.username]);

    async function handleSearch(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const petId = fd.get("pet") || null;
        const keyword = fd.get("keyword") || null;
        setSelectedPet(petId?.toString() ?? "");
        setLastKeyword(keyword?.toString() ?? "");
        try {
            setEntries(await fetchChatEntries(auth.token, params.username, petId || null, keyword || null));
            setPage(1);
        } catch (err) { setError(err); }
    }


    function truncate(text: string, words = 6) {
        const parts = text?.split(" ") ?? [];
        return parts.length > words ? parts.slice(0, words).join(" ") + " [...]" : text;
    }

    function formatDate(ts: string) {
        if (!ts) return "—";
        return ts.split(" ").slice(0, 2).join(" ");
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Istoric întrebări</h1>
                    <p className="mt-0.5 text-sm text-slate-400">Toate conversațiile asistate</p>
                </div>
                { auth.user.username === params.username &&
                <button
                    onClick={() => navigate("/ask")}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                    ✨ Întrebare nouă
                </button>
                }
            </div>

            {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{String(error)}</div>}

            <form onSubmit={handleSearch} className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <select
                    name="pet"
                    value={selectedPet}
                    onChange={e => setSelectedPet(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                    <option value="">Toate animalele</option>
                    {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input
                    name="keyword"
                    value={lastKeyword}
                    onChange={e => setLastKeyword(e.target.value)}
                    placeholder="Cuvânt cheie..."
                    className="flex-1 min-w-[160px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                    Caută
                </button>
                <button type="button" onClick={() => { setSelectedPet(""); setLastKeyword(""); }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                    Reset
                </button>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <span className="text-4xl">✨</span>
                        <p className="mt-3 text-sm">Nu există întrebări în istoric</p>
                    </div>
                ) : entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(entry => (
                    <div key={entry.id} className="flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50 hover:cursor-pointer"
                         onClick={() => {
                             sessionStorage.setItem("questionId", entry.id.toString());
                             navigate(`/ask/history/${params.username}/details`);
                         }}>
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-base">
                            ✨
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-800 text-sm">{truncate(entry.userMessage)}</span>
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                                    🐾 {entry.pet?.name}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 truncate">{truncate(entry.botResponse, 10)}</p>
                            <p className="text-xs text-slate-300">{formatDate(entry.timestamp)}</p>
                        </div>

                    </div>
                ))}
                <div className="px-5 border-t border-slate-100">
                    <Pagination total={entries.length} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
                </div>
            </div>
        </div>
    );
}
