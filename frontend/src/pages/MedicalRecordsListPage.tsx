import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isAdmin, isVeterinarian } from "../api/roles.ts";
import {
    filterPets, getAllBreeds, getAllTypes, getBreedsByType,
    getRecords, getRecordsByVet,
} from "../api/api.ts";
import { DatePicker } from "rsuite";
import {
    SlidersIcon, ChevronDownIcon,
    CalendarSmallIcon, HeadphonesIcon, BuildingSmallIcon,
} from "../components/Icons.tsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBookMedical} from "@fortawesome/free-solid-svg-icons";
import Pagination from "../components/Pagination.tsx";

const PAGE_SIZE = 10;

export default function RecordsList() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [records, setRecords] = useState([]);
    const [listError, setListError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [lastOwnerString, setLastOwnerString] = useState("");
    const [lastNameString, setLastNameString] = useState("");
    const [lastType, setLastType] = useState("");
    const [lastBreed, setLastBreed] = useState("");
    const [types, setTypes] = useState([]);
    const [breeds, setBreeds] = useState([]);
    const [onlyGenerated, setOnlyGenerated] = useState(false);
    const [lastVetString, setLastVetString] = useState("");
    const [page, setPage] = useState(1);
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);

    async function fetchBreedsByType(typeId) {
        try { setBreeds(await getBreedsByType(typeId)); }
        catch (err) { setListError(err.message); setBreeds([]); }
    }

    async function fetchRecords(
        vet = null, owner = null, name = null,
        typeId = null, breedId = null, generated = false,
        startDate = null, endDate = null
    ) {
        try {
            if (name || owner || typeId || breedId) {
                const pets = await filterPets(auth.token, owner, name, typeId, breedId);
                const all = [];
                for (const pet of pets) {
                    let res;
                    if (isAdmin(auth.user.roles))
                        res = await getRecords(auth.token, vet, null, pet.name, generated, startDate, endDate);
                    else if (isVeterinarian(auth.user.roles))
                        res = await getRecordsByVet(auth.token, auth.user.id, null, pet.name, generated, startDate, endDate);
                    else
                        res = await getRecords(auth.token, vet, auth.user.username, pet.name, generated, startDate, endDate);
                    all.push(...res);
                }
                setRecords(all);
            } else {
                let res;
                if (isAdmin(auth.user.roles))
                    res = await getRecords(auth.token, vet, null, null, generated, startDate, endDate);
                else if (isVeterinarian(auth.user.roles))
                    res = await getRecordsByVet(auth.token, auth.user.id, null, null, generated, startDate, endDate);
                else
                    res = await getRecords(auth.token, vet, auth.user.username, null, generated, startDate, endDate);
                setRecords(res);
            }
            setListError(null);
            setPage(1);
        } catch (err) { setListError(err.message); setRecords([]); }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const fmt = { year: "numeric", month: "2-digit", day: "2-digit" } as const;
        const startDate = start
            ? new Intl.DateTimeFormat("en-GB", fmt).format(start).replaceAll("/", ".").replace(", ", " ")
            : null;
        const endDate = end
            ? new Intl.DateTimeFormat("en-GB", fmt).format(end).replaceAll("/", ".").replace(", ", " ")
            : null;
        setSearchParams(
            startDate && endDate ? { startDate, endDate }
                : startDate ? { startDate }
                    : endDate ? { endDate } : {}
        );
        const fd = new FormData(e.target);
        const vet = fd.get("vet")?.toString() || null;
        const owner = fd.get("owner")?.toString() || null;
        const name = fd.get("name")?.toString() || null;
        const typeId = fd.get("type")?.toString() || null;
        const breedId = fd.get("breed")?.toString() || null;
        if (vet) setLastVetString(vet);
        if (owner) setLastOwnerString(owner);
        if (name) setLastNameString(name);
        if (typeId) setLastType(typeId);
        if (breedId) setLastBreed(breedId);
        await fetchRecords(vet, owner, name, typeId, breedId, onlyGenerated, startDate, endDate);
    }

    useEffect(() => {
        const fetchTypes = async () => { try { setTypes(await getAllTypes()); } catch (e) { console.error(e.message); } };
        const fetchBreeds = async () => { try { setBreeds(await getAllBreeds()); } catch (e) { console.error(e.message); } };
        fetchTypes();
        fetchBreeds();
        const loadRecords = async () => {
            try {
                fetchRecords(null, null, null, null, null, false,
                    searchParams.get("startDate"), searchParams.get("endDate"));
            }
            catch (err) {
                console.error(err.message);
            }
        }
        loadRecords();

    }, []);

    function goToDetails(id: number) {
        sessionStorage.setItem("recordId", String(id));
        navigate("/records/details");
    }


    const activeFilterCount = [
        lastVetString, lastOwnerString, lastNameString,
        lastType, lastBreed, start, end, onlyGenerated,
    ].filter(Boolean).length;

    return (
        <div className="space-y-4" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 m-0">Rapoarte medicale</h1>
                </div>
            </div>

            {listError && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{listError}</div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <button type="button" onClick={() => setShowFilters(v => !v)}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 cursor-pointer">
                        <SlidersIcon />
                        Filtrează
                        {activeFilterCount > 0 && (
                            <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                                {activeFilterCount}
                            </span>
                        )}
                        <ChevronDownIcon className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
                    </button>
                </div>

                {showFilters && (
                    <form onSubmit={handleSubmit} className="mt-4 border-t border-slate-100 pt-4">
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {!isVeterinarian(auth.user.roles) && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-slate-500">Veterinar</label>
                                    <input name="vet" value={lastVetString} onChange={e => setLastVetString(e.target.value)}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                        placeholder="Username vet" />
                                </div>
                            )}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Proprietar</label>
                                <input name="owner" value={lastOwnerString} onChange={e => setLastOwnerString(e.target.value)}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                    placeholder="Username proprietar" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Animal</label>
                                <input name="name" value={lastNameString} onChange={e => setLastNameString(e.target.value)}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                    placeholder="Numele animalului" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Specie</label>
                                <select name="type" value={lastType}
                                    onChange={e => { setLastType(e.target.value); fetchBreedsByType(e.target.value); }}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                                    <option value="">Toate</option>
                                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Rasă</label>
                                <select name="breed" value={lastBreed} onChange={e => setLastBreed(e.target.value)}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                                    <option value="">Toate</option>
                                    {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">De la</label>
                                <DatePicker format="dd.MM.yyyy" value={start} placeholder="Început" onChange={setStart} style={{ width: "100%" }} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Până la</label>
                                <DatePicker format="dd.MM.yyyy" value={end} placeholder="Final" onChange={setEnd} style={{ width: "100%" }} />
                            </div>
                            <label className="flex flex-col items-start gap-2 cursor-pointer">
                                <span className="text-xs text-slate-500">{onlyGenerated ? "Generate AI" : "Toate"}</span>
                                <div
                                    onClick={() => setOnlyGenerated(v => !v)}
                                    className={`relative h-5 w-9 rounded-full transition-colors ${onlyGenerated ? "bg-emerald-500" : "bg-slate-200"}`}
                                >
                                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${onlyGenerated ? "translate-x-4" : "translate-x-0.5"}`} />
                                </div>
                            </label>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button type="submit"
                                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition cursor-pointer">
                                Aplică filtre
                            </button>
                            <button type="button" onClick={() => {
                                setLastVetString(""); setLastOwnerString(""); setLastNameString("");
                                setLastType(""); setLastBreed(""); setStart(null); setEnd(null);
                                setOnlyGenerated(false); setSearchParams({});
                                fetchRecords();
                            }} className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                                Resetare
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 overflow-hidden">
                {records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <span className="text-4xl">📋</span>
                        <p className="mt-3 text-sm">Nu există rapoarte medicale</p>
                    </div>
                ) : records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(r => (
                    <div
                        key={r.id}
                        onClick={() => goToDetails(r.id)}
                        className="flex items-center gap-4 px-5 py-4 cursor-pointer transition hover:bg-slate-50"
                    >
                        <FontAwesomeIcon icon={faBookMedical} className="text-emerald-600" size="2x" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="m-0 font-semibold text-slate-800 text-sm">{r.pet?.name ?? <em>Animal șters</em>}</p>
                                <p className="m-0 text-xs text-slate-400">· {r.pet?.owner?.username ?? <em>Utilizator dezactivat</em>}</p>
                            </div>
                            <div className="flex items-center gap-5 mt-2 flex-wrap">
                                <div className="col-3">
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <CalendarSmallIcon size={11} />
                                    {r.recordDate ?? "—"}
                                </span>
                                </div>
                                <div className="col-3">
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <HeadphonesIcon size={11} />
                                    {r.vet?.username ?? <em>Utilizator dezactivat</em>}
                                </span>
                                    </div>
                                <div className="col-3">
                                    <span className="flex items-center gap-1 text-xs text-slate-400">
                                        <BuildingSmallIcon size={11} />
                                        {r.appointment?.clinic?.name ?? <em>Clinică dezactivată</em>}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <span style={{ color: "#94a3b8", fontSize: 18 }}>›</span>
                    </div>
                ))}
                <div className="px-5">
                    <Pagination total={records.length} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
                </div>
            </div>
        </div>
    );
}
