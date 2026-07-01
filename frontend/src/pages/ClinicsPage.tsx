import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import { useNavigate } from "react-router-dom";
import { getAllClinics } from "../api/api.ts";
import { isAdmin } from "../api/roles.ts";
import AddClinicForm from "./AddClinicForm.tsx";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";
import { SearchIcon } from "../components/Icons.tsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBuilding} from "@fortawesome/free-regular-svg-icons";
import Pagination from "../components/Pagination.tsx";

const PAGE_SIZE = 10;

export default function Clinics() {
    const auth = useContext(AuthContext);
    const [data, setData] = useState([]);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [lastVetString, setLastVetString] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [closeCount, setCloseCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const getClinics = async () => { setData(await getAllClinics(null, null)); };
        getClinics();
        const loadMessages = () => {
            if (sessionStorage.getItem("deletedClinicId")) {
                setShowSuccess(true);
                setSuccessMessage("Clinica a fost ștearsă cu succes");
                sessionStorage.removeItem("deletedClinicId");
            }
        }
        loadMessages();
    }, [closeCount]);

    async function handleSearch(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const clinic = fd.get("name") || null;
        const vet = fd.get("employee") || null;
        try { setData(await getAllClinics(clinic || null, vet || null)); setPage(1); } catch (err) { setError(err.message); }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Clinici</h1>
                    <p className="mt-0.5 text-sm text-slate-400">Clinicile veterinare înregistrate</p>
                </div>
                {auth.user && isAdmin(auth.user.roles) && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                        + Adaugă clinică
                    </button>
                )}
            </div>

            <form onSubmit={handleSearch} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-3/5 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                        name="name"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Caută clinică..."
                        className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                </div>
                <input
                    name="employee"
                    value={lastVetString}
                    onChange={e => setLastVetString(e.target.value)}
                    placeholder="Veterinar angajat..."
                    className="w-48 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                <button type="submit"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                    Căutare
                </button>
                <button type="button" onClick={() => { setSearchQuery(""); setLastVetString(""); }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                    Resetare
                </button>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
                {data.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">Nu există clinici înregistrate</div>
                ) : data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(clinic => (
                    <div key={clinic.id} className="flex items-center justify-between px-5 py-4 transition hover:bg-slate-50 hover:cursor-pointer"
                         onClick={() => navigate(`/clinics/${clinic.id}`)}
                    >
                        <div className="flex items-center gap-4">
                            <FontAwesomeIcon icon={faBuilding} className="text-slate-400" size="2x" />
                            <div className="flex flex-col gap-2">
                                <span className="font-semibold text-slate-800">{clinic.name}</span>
                                {clinic.address && (
                                    <span className="text-xs text-slate-400">{clinic.address}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div className="px-5">
                    <Pagination total={data.length} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
                </div>
            </div>

            <AddClinicForm
                open={showAddModal}
                save={() => { setShowAddModal(false); setCloseCount(p => p + 1); }}
                close={() => setShowAddModal(false)}
                showToast={() => { setSuccessMessage("Clinica a fost adăugată cu succes"); setShowSuccess(true); }}
            />
            <SuccessToast message={successMessage} close={() => setShowSuccess(false)} show={showSuccess} />
            <ErrorToast show={!!error} close={() => setError(null)} message={error} />
        </div>
    );
}
