import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import { findPetByOwnerAndName, findUserByUsername, getAllBreeds, getAllTypes, getBreedsByType } from "../api/api.ts";
import { useNavigate, useParams } from "react-router-dom";
import AddPetForm from "./AddPetForm.tsx";
import type { PetDTO, RoleDTO, UserDTO } from "../types.ts";
import { isPetOwner } from "../api/roles.ts";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";
import { SlidersIcon, ChevronDownIcon } from "../components/Icons.tsx";

type PetWithPhoto = PetDTO & { photoUrl?: string };

export default function PersonalPets() {
    const auth = useContext(AuthContext);
    const [pets, setPets] = useState<PetWithPhoto[] | null>(null);
    const params = useParams();
    const [owner, setOwner] = useState<UserDTO | { id?: string; username?: string; roles?: RoleDTO[] }>({ username: params.username });
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [closeCount, setCloseCount] = useState(0);
    const navigate = useNavigate();
    const [showFilters, setShowFilters] = useState(false);
    const [lastBreed, setLastBreed] = useState("");
    const [lastType, setLastType] = useState("");
    const [lastNameString, setLastNameString] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [error, setError] = useState(null);
    const [types, setTypes] = useState([]);
    const [breeds, setBreeds] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    async function fetchBreedsByType(typeId) {
        try { setBreeds(await getBreedsByType(typeId)); } catch { setBreeds([]); }
    }

    const fetchPets = async () => {
        try {
            setLoading(true);
            const ownerRes = await findUserByUsername(auth.token, params.username);
            setOwner(ownerRes);
            setIsOwner(auth.user.id === ownerRes.id);
            const res = await findPetByOwnerAndName(auth.token, params.username);
            setPets(res);
            if (auth.user.id !== ownerRes.id && isPetOwner(auth.user.roles)) {
                navigate("/access-denied");
                return;
            }
        } catch (err) {
            setError(err);
            setPets([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sessionStorage.getItem("deletedPetId")) {
            setSuccessMessage("Datele au fost șterse cu succes");
            setShowSuccess(true);
            sessionStorage.removeItem("deletedPetId");
        }
        const fetchTypes = async () => { try { setTypes(await getAllTypes()); } catch (err) {console.error(err.message)} };
        const fetchBreeds = async () => { try { setBreeds(await getAllBreeds()); } catch (err) {console.error(err.message)} };
        fetchTypes(); fetchBreeds(); fetchPets();
    }, [params.username, closeCount]);

    async function handleSearch(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        let name = fd.get("name").toString() || null;
        let typeId = fd.get("type").toString() || null;
        let breedId = fd.get("breed").toString() || null;
        if (name === "") name = null;
        if (typeId === "") typeId = null;
        if (breedId === "") breedId = null;
        setLastNameString(name ?? "");
        setLastType(typeId ?? "");
        setLastBreed(breedId ?? "");
        try {
            setLoading(true);
            let res = await findPetByOwnerAndName(auth.token, params.username, name);
            if (typeId) res = res.filter(p => p.breed?.petType?.id?.toString() === typeId.toString());
            if (breedId) res = res.filter(p => p.breed?.id?.toString() === breedId.toString());
            setPets(res);
        } catch (err) {
            setPets([]);
            setError(err);
        } finally { setLoading(false); }
    }

    if (!isOwner && isPetOwner(auth.user.roles)) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isOwner ? "Animalele mele" : `Animale — ${owner?.username}`}
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isOwner ? "Gestionează animalele tale de companie" : "Animale de companie ale utilizatorului"}
                    </p>
                </div>
                {isOwner && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                        + Adaugă animal
                    </button>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => setShowFilters(v => !v)}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                        <SlidersIcon />
                        Filtrează
                        <ChevronDownIcon className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
                    </button>
                    <span className="text-sm text-slate-400">
                        {[lastNameString, lastType, lastBreed].filter(Boolean).length} filtre active
                    </span>
                </div>
                {showFilters && (
                    <form onSubmit={handleSearch} className="mt-4 border-t border-slate-100 pt-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Nume animal</label>
                                <input name="name" value={lastNameString} onChange={e => setLastNameString(e.target.value)}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                    placeholder="Caută după nume" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Specie</label>
                                <select name="type" value={lastType}
                                    onChange={e => { setLastType(e.target.value); fetchBreedsByType(e.target.value); }}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                                    <option value="">Toate speciile</option>
                                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Rasă</label>
                                <select name="breed" value={lastBreed} onChange={e => setLastBreed(e.target.value)}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                                    <option value="">Toate rasele</option>
                                    {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">Aplică filtre</button>
                            <button type="button" onClick={() => { setLastNameString(""); setLastType(""); setLastBreed(""); }}
                                className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Resetare</button>
                        </div>
                    </form>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                </div>
            ) : pets.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pets.map(pet => (
                        <div key={pet.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:cursor-pointer"
                             onClick={() => navigate(`/pets/${pet.owner.username}/${pet.name}`)}
                        >
                            <div className="flex items-center gap-3">
                                {pet.photoUrl ? (
                                    <img src={pet.photoUrl} alt={pet.name}
                                        className="h-12 w-12 rounded-xl object-cover border border-slate-100" />
                                ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl border border-emerald-100">🐾</div>
                                )}
                                <div>
                                    <p className="font-semibold text-slate-800 mb-0">{pet.name}</p>
                                    {pet.breed?.petType?.name && (
                                        <span className="text-xs text-slate-400">{pet.breed.petType.name}</span>
                                    )}
                                </div>
                            </div>
                            {pet.breed?.name && (
                                <span className="w-fit rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                                    {pet.breed.name}
                                </span>
                            )}
                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                <span className="text-xs text-slate-400">ID: {pet.id}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <span className="text-5xl">🐾</span>
                    <p className="mt-3 text-sm">Nu s-au găsit animale pentru <b>{owner?.username}</b></p>
                    {isOwner && (
                        <button onClick={() => setShowAddModal(true)}
                            className="mt-4 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                            Adaugă primul animal
                        </button>
                    )}
                </div>
            )}

            <AddPetForm open={showAddModal} save={() => { setShowAddModal(false); setCloseCount(p => p + 1); }} close={() => setShowAddModal(false)} />
            <SuccessToast show={showSuccess} close={() => setShowSuccess(false)} message={successMessage} />
            <ErrorToast show={showError} close={() => setShowError(false)} message={error} />
        </div>
    );
}
