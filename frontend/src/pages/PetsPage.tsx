import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import {
    addBreed,
    addPetType,
    deleteBreed,
    deletePetType,
    filterPets,
    getAllBreeds,
    getAllTypes,
    getBreedsByType,
    updateBreed,
    updatePetType,
} from "../api/api.ts";
import { SlidersIcon, ChevronDownIcon } from "../components/Icons.tsx";
import { useNavigate } from "react-router-dom";
import {isAdmin, isVeterinarian} from "../api/roles.ts";
import Confirm from "../components/Confirm.tsx";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";



function TabBar({ tabs, active, onChange }: { tabs: { key: string; label: string }[]; active: string; onChange: (k: string) => void }) {
    return (
        <div className="flex" style={{ borderBottom: "1px solid #e2e8f0" }}>
            {tabs.map(tab => (
                <button key={tab.key} type="button" onClick={() => onChange(tab.key)}
                    style={{
                        border: "none", background: "transparent",
                        padding: "13px 0", marginRight: 28, fontSize: 14, fontWeight: 600,
                        color: active === tab.key ? "#1d9e75" : "#94a3b8", cursor: "pointer",
                        borderBottom: active === tab.key ? "2px solid #1d9e75" : "2px solid transparent",
                        transition: "color .15s",
                    }}>
                    {tab.label}
                </button>
            ))}
        </div>
    );
}


function PetsTab() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [types, setTypes] = useState([]);
    const [breeds, setBreeds] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [lastOwner, setLastOwner] = useState("");
    const [lastName, setLastName] = useState("");
    const [lastType, setLastType] = useState("");
    const [lastBreed, setLastBreed] = useState("");

    async function fetchBreedsByType(typeId: string) {
        try { setBreeds(await getBreedsByType(typeId)); } catch { setBreeds([]); }
    }

    async function load(owner?: string | null, name?: string | null, type?: string | null, breed?: string | null) {
        try {
            setLoading(true);
            setPets(await filterPets(auth.token, owner ?? null, name ?? null, type ?? null, breed ?? null));
            setError(null);
        } catch (err) { setPets([]); setError(String(err)); }
        finally { setLoading(false); }
    }

    useEffect(() => {
        const fetchMeta = async () => {
            try { setTypes(await getAllTypes()); } catch (err) {console.error(err.message)}
            try { setBreeds(await getAllBreeds()); } catch (err) {console.error(err.message)}
        };
        fetchMeta();
        load();
    }, []);

    async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const owner = fd.get("owner")?.toString() || "";
        const name = fd.get("name")?.toString() || "";
        const type = fd.get("type")?.toString() || "";
        const breed = fd.get("breed")?.toString() || "";
        setLastOwner(owner); setLastName(name); setLastType(type); setLastBreed(breed);
        await load(owner || null, name || null, type || null, breed || null);
    }


    const activeCount = [lastOwner, lastName, lastType, lastBreed].filter(Boolean).length;

    return (
        <div className="space-y-4 pt-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <button type="button" onClick={() => setShowFilters(v => !v)}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                        <SlidersIcon /> Filtrează
                        <ChevronDownIcon className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
                    </button>
                    <span className="flex items-center gap-1.5 text-sm text-slate-400">
                        <SlidersIcon size={14} /> {activeCount} filtre active
                    </span>
                </div>
                {showFilters && (
                    <form onSubmit={handleSearch} className="mt-4 border-t border-slate-100 pt-4">
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Proprietar</label>
                                <input name="owner" value={lastOwner} onChange={e => setLastOwner(e.target.value)}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-40"
                                    placeholder="Username proprietar" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Nume animal</label>
                                <input name="name" value={lastName} onChange={e => setLastName(e.target.value)}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                    placeholder="Numele animalului" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Specie</label>
                                <select name="type" value={lastType}
                                    onChange={e => { setLastType(e.target.value); fetchBreedsByType(e.target.value); }}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                                    <option value="">Toate speciile</option>
                                    {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Rasă</label>
                                <select name="breed" value={lastBreed} onChange={e => setLastBreed(e.target.value)}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                                    <option value="">Toate rasele</option>
                                    {breeds.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">Aplică filtre</button>
                            <button type="button" onClick={() => { setLastOwner(""); setLastName(""); setLastType(""); setLastBreed(""); load(null); }}
                                className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Resetare</button>
                        </div>
                    </form>
                )}
            </div>

            {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                </div>
            ) : pets.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pets.map((pet) => (
                        <div key={pet.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:cursor-pointer"
                             onClick={() => navigate(`/pets/${pet.owner.username}/${pet.name}`)}>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl border border-emerald-100">🐾</div>
                                <div>
                                    <p className="font-semibold text-slate-800 mb-0">{pet.name}</p>
                                    <p className="text-xs text-slate-400 mb-0">@{pet.owner?.username}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {pet.breed?.petType?.name && (
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">{pet.breed.petType.name}</span>
                                )}
                                {pet.breed?.name && (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">{pet.breed.name}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                <span className="text-xs text-slate-400">
                                    {pet.gender === "MALE" ? "♂ Mascul" : pet.gender === "FEMALE" ? "♀ Femelă" : ""}
                                    {pet.weight ? ` · ${pet.weight} kg` : ""}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <span className="text-5xl">🐾</span>
                    <p className="mt-3 text-sm">Nu au fost găsite animale de companie</p>
                </div>
            )}
        </div>
    );
}


function BreedsTab() {
    const auth = useContext(AuthContext);
    const [breeds, setBreeds] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reloadCount, setReloadCount] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState("");
    const [newTypeId, setNewTypeId] = useState("");
    const [addError, setAddError] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [filterType, setFilterType] = useState("");
    const [searchQ, setSearchQ] = useState("");
    const [editId, setEditId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editTypeId, setEditTypeId] = useState("");

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [b, t] = await Promise.all([getAllBreeds(), getAllTypes()]);
                setBreeds(b);
                setTypes(t);
                if (!newTypeId && t.length > 0) setNewTypeId(String(t[0].id));
            } catch (err) { setError(err.message); }
            finally { setLoading(false); }
        };
        load();
    }, [reloadCount]);

    async function handleAdd() {
        if (!newName.trim()) { setAddError("Introduceți un nume."); return; }
        if (!newTypeId) { setAddError("Selectați o specie."); return; }
        try {
            await addBreed(auth.token, newName.trim(), newTypeId);
            setNewName(""); setShowAdd(false); setAddError(null);
            setSuccessMessage("Rasa a fost adăugată"); setShowSuccess(true);
            setReloadCount(p => p + 1);
        } catch (err) { setAddError(err.message); }
    }

    async function handleDelete(id: number) {
        try {
            await deleteBreed(auth.token, id);
            setSuccessMessage("Rasa a fost ștearsă"); setShowSuccess(true);
            setReloadCount(p => p + 1);
        } catch (err) { setError(err.message); }
    }

    async function handleEdit(id: number) {
        if (!editName.trim()) return;
        try {
            await updateBreed(auth.token, { id, name: editName.trim(), petType: { id: Number(editTypeId) } });
            setEditId(null);
            setSuccessMessage("Rasa a fost actualizată"); setShowSuccess(true);
            setReloadCount(p => p + 1);
        } catch (err) { setError(err.message); }
    }

    const visible = breeds.filter(b =>
        (!filterType || String(b.petType?.id) === filterType) &&
        (!searchQ || b.name?.toLowerCase().includes(searchQ.toLowerCase()))
    );

    return (
        <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 flex-wrap justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Caută rasă..."
                            className="rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    </div>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                        <option value="">Toate speciile</option>
                        {types.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                    </select>
                </div>
                <button type="button" onClick={() => setShowAdd(v => !v)} style={{ border: "none" }}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition cursor-pointer">
                    + Adaugă rasă
                </button>
            </div>

            {showAdd && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 px-5 py-4 flex items-end gap-3 flex-wrap">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500">Nume rasă</label>
                        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="ex: Labrador Retriever"
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500">Specie</label>
                        <select value={newTypeId} onChange={e => setNewTypeId(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                            {types.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                        </select>
                    </div>
                    <button type="button" onClick={handleAdd} style={{ border: "none" }}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition cursor-pointer">
                        Salvează
                    </button>
                    <button type="button" onClick={() => { setShowAdd(false); setAddError(null); setNewName(""); }}
                        style={{ background: "transparent" }}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                        Anulare
                    </button>
                    {addError && <p className="w-full m-0 text-sm text-red-500">{addError}</p>}
                </div>
            )}

            {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-3">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                    </div>
                ) : visible.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">Nu au fost găsite rase</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                {["Rasă", "Specie", ""].map(h => (
                                    <th key={h} className="text-left px-6 py-3"
                                        style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((b) => (
                                <tr key={b.id} style={{ borderBottom: "1px solid #f8fafc" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                    {editId === b.id ? (
                                        <>
                                            <td className="px-6 py-2.5">
                                                <input value={editName} onChange={e => setEditName(e.target.value)}
                                                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 w-full" />
                                            </td>
                                            <td className="px-6 py-2.5">
                                                <select value={editTypeId} onChange={e => setEditTypeId(e.target.value)}
                                                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                                                    {types.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-2.5 text-right flex gap-2 justify-end">
                                                <button type="button" onClick={() => handleEdit(b.id)}
                                                    className="rounded-xl px-3 py-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer" style={{ border: "none" }}>
                                                    Salvează
                                                </button>
                                                <button type="button" onClick={() => setEditId(null)}
                                                    className="rounded-xl px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer" style={{ border: "1px solid #e2e8f0" }}>
                                                    Anulare
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-3.5 text-sm font-medium text-slate-800">{b.name}</td>
                                            <td className="px-6 py-3.5">
                                                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                                                    {b.petType?.name ?? "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button type="button" onClick={() => { setEditId(b.id); setEditName(b.name); setEditTypeId(String(b.petType?.id ?? "")); }}
                                                        className="rounded-xl px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                                                        style={{ border: "1px solid #a7f3d0" }}>
                                                        Editează
                                                    </button>
                                                    <button type="button" onClick={() => setDeleteId(b.id)}
                                                        className="rounded-xl px-3 py-1 text-xs font-semibold !bg-red-500 text-white hover:!bg-red-600 transition cursor-pointer"
                                                        style={{ border: "1px solid #fecaca", background: "#fff1f2" }}>
                                                        Șterge
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Confirm open={deleteId !== null} close={() => setDeleteId(null)}
                confirm={() => { handleDelete(deleteId!); setDeleteId(null); }}
                message="Doriți să ștergeți această rasă?" />
            <SuccessToast show={showSuccess} close={() => setShowSuccess(false)} message={successMessage} />
            <ErrorToast show={!!error} close={() => setError(null)} message={error} />
        </div>
    );
}


function TypesTab() {
    const auth = useContext(AuthContext);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reloadCount, setReloadCount] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState("");
    const [addError, setAddError] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [searchQ, setSearchQ] = useState("");
    const [editId, setEditId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try { setTypes(await getAllTypes()); }
            catch (err) { setError(err.message); }
            finally { setLoading(false); }
        };
        load();
    }, [reloadCount]);

    async function handleAdd() {
        if (!newName.trim()) { setAddError("Introduceți un nume."); return; }
        try {
            await addPetType(auth.token, newName.trim());
            setNewName(""); setShowAdd(false); setAddError(null);
            setSuccessMessage("Specia a fost adăugată"); setShowSuccess(true);
            setReloadCount(p => p + 1);
        } catch (err) { setAddError(err.message); }
    }

    async function handleDelete(id: number) {
        try {
            await deletePetType(auth.token, id);
            setSuccessMessage("Specia a fost ștearsă"); setShowSuccess(true);
            setReloadCount(p => p + 1);
        } catch (err) { setError(err.message); }
    }

    async function handleEdit(id: number) {
        if (!editName.trim()) return;
        try {
            await updatePetType(auth.token, { id, name: editName.trim() });
            setEditId(null);
            setSuccessMessage("Specia a fost actualizată"); setShowSuccess(true);
            setReloadCount(p => p + 1);
        } catch (err) { setError(err.message); }
    }

    const visible = types.filter(t => !searchQ || t.name?.toLowerCase().includes(searchQ.toLowerCase()));

    return (
        <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 justify-between flex-wrap">
                <div className="relative">
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Caută specie..."
                        className="rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                </div>
                <button type="button" onClick={() => setShowAdd(v => !v)} style={{ border: "none" }}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition cursor-pointer">
                    + Adaugă specie
                </button>
            </div>

            {showAdd && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 px-5 py-4 flex items-end gap-3 flex-wrap">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500">Nume specie</label>
                        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="ex: Câine"
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    </div>
                    <button type="button" onClick={handleAdd} style={{ border: "none" }}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition cursor-pointer">
                        Salvează
                    </button>
                    <button type="button" onClick={() => { setShowAdd(false); setAddError(null); setNewName(""); }}
                        style={{ background: "transparent" }}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                        Anulare
                    </button>
                    {addError && <p className="w-full m-0 text-sm text-red-500">{addError}</p>}
                </div>
            )}

            {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-3">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                    </div>
                ) : visible.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">Nu au fost găsite specii</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                {["Specie", ""].map(h => (
                                    <th key={h} className="text-left px-6 py-3"
                                        style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((t) => (
                                <tr key={t.id} style={{ borderBottom: "1px solid #f8fafc" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                    {editId === t.id ? (
                                        <>
                                            <td className="px-6 py-2.5">
                                                <input value={editName} onChange={e => setEditName(e.target.value)}
                                                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 w-full" />
                                            </td>
                                            <td className="px-6 py-2.5 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button type="button" onClick={() => handleEdit(t.id)}
                                                        className="rounded-xl px-3 py-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer" style={{ border: "none" }}>
                                                        Salvează
                                                    </button>
                                                    <button type="button" onClick={() => setEditId(null)}
                                                        className="rounded-xl px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer" style={{ border: "1px solid #e2e8f0" }}>
                                                        Anulare
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-3.5 text-sm font-medium text-slate-800">{t.name}</td>
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button type="button" onClick={() => { setEditId(t.id); setEditName(t.name); }}
                                                        className="rounded-xl px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                                                        style={{ border: "1px solid #a7f3d0" }}>
                                                        Editează
                                                    </button>
                                                    <button type="button" onClick={() => setDeleteId(t.id)}
                                                        className="rounded-xl px-3 py-1 text-xs font-semibold !bg-red-500 text-white hover:!bg-red-600 transition cursor-pointer"
                                                        style={{ border: "1px solid #fecaca", background: "#fff1f2" }}>
                                                        Șterge
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Confirm open={deleteId !== null} close={() => setDeleteId(null)}
                confirm={() => { handleDelete(deleteId!); setDeleteId(null); }}
                message="Doriți să ștergeți această specie? Rasele asociate pot fi afectate." />
            <SuccessToast show={showSuccess} close={() => setShowSuccess(false)} message={successMessage} />
            <ErrorToast show={!!error} close={() => setError(null)} message={error} />
        </div>
    );
}


const ADMIN_TABS = [
    { key: "animals", label: "Animale" },
    { key: "breeds", label: "Rase" },
    { key: "types", label: "Specii" },
];

export default function Pets() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const admin = isAdmin(auth.user?.roles);
    const [tab, setTab] = useState("animals");

    if (!admin) {
        return (
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Animale de companie</h1>
                        <p className="mt-0.5 text-sm text-slate-400">Gestionează animalele înregistrate</p>
                    </div>
                    {
                        isVeterinarian(auth.user.roles) && <>
                        <button onClick={() => navigate(`/pets/${auth.user.username}`)}
                    className="flex items-center gap-2 rounded-xl bg-green-50 hover:bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-emerald-600 hover:text-white shadow-sm transition !border !border-green-300">
                    🐾 Animalele mele
                </button>
                        </>
                    }
                </div>
                <PetsTab/>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Animale de companie</h1>
                    <p className="mt-0.5 text-sm text-slate-400">Gestionează animalele, rasele și speciile</p>
                </div>
                <button onClick={() => navigate(`/pets/${auth.user.username}`)}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition">
                    🐾 Animalele mele
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-6 pb-6 shadow-sm">
                <TabBar tabs={ADMIN_TABS} active={tab} onChange={setTab} />
                {tab === "animals" && <PetsTab/>}
                {tab === "breeds" && <BreedsTab />}
                {tab === "types" && <TypesTab />}
            </div>
        </div>
    );
}
