import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import { changeRole, getAllUsers, getAllVeterinarians } from "../api/api.ts";
import roles, { isAdmin, isPetOwner } from "../api/roles.ts";
import { useNavigate } from "react-router-dom";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";
import { SearchIcon } from "../components/Icons.tsx";
import Pagination from "../components/Pagination.tsx";

const PAGE_SIZE = 10;

export default function UsersList() {
    const auth = useContext(AuthContext);
    const [data, setData] = useState([]);
    const [edit, setEdit] = useState<string | null>(null);
    const [pendingRole, setPendingRole] = useState("");
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState("");
    const [inputSearch, setInputSearch] = useState("");
    const [inputFilter, setInputFilter] = useState("");
    const [error, setError] = useState(null);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [page, setPage] = useState(1);

    const isOwner = isPetOwner(auth.user.roles);
    const isAdminUser = isAdmin(auth.user.roles);

    function mapRoleToName(role: string) {
        if (role.toLowerCase() === 'admin') return 'admin';
        else if (role.toLowerCase() === 'pet_owner') return 'proprietar';
        else if (role.toLowerCase() === 'veterinarian') return 'veterinar';
    }

    async function handleRoleChange(userId: string) {
        try {
            const updatedUser = await changeRole(auth.token, userId, pendingRole);
            setData(data.map(u => u.id === updatedUser.id ? updatedUser : u));
            setEdit(null);
            setShowSuccess(true);
        } catch (err) {
            setError(err.message);
            setShowError(true);
        }
    }

    async function loadUsers(userString?: string, role?: string) {
        if (isOwner) {
            setData(await getAllVeterinarians(auth.token, userString || null));
        } else {
            setData(await getAllUsers(auth.token, userString || null, role || null));
        }
        setPage(1);
    }

    useEffect(() => {
        const loadData = async () => {
            loadUsers();
        }
        loadData();
    }, []);

    const filtered = data.filter(u =>
        (searchQuery === "" || u.username?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (filterRole === "" || u.roles?.some(r => r.name === filterRole))
    );

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    {isOwner ? "Personal VetPath" : "Utilizatori"}
                </h1>
                <p className="mt-0.5 text-sm text-slate-400">
                    {isOwner ? "Medicii veterinari înregistrați" : "Gestionează utilizatorii platformei"}
                </p>
            </div>

            <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-3/5 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                        type="text"
                        placeholder="Caută după username..."
                        value={inputSearch}
                        onChange={e => setInputSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                </div>
                {isAdmin(auth.user.roles) && (
                    <select
                        value={inputFilter}
                        onChange={e => setInputFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                        <option value="">Toate rolurile</option>
                        {roles.map(r => (
                            <option key={r.name} value={r.name}>{mapRoleToName(r.name)}</option>
                        ))}
                    </select>
                )}
                <button
                    onClick={() => {
                        // apply the input values as active filters and reload
                        setSearchQuery(inputSearch);
                        setFilterRole(inputFilter);
                        loadUsers(inputSearch, inputFilter);
                    }}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                >
                    Caută
                </button>
                <button
                    onClick={() => { setInputSearch(""); setInputFilter(""); setSearchQuery(""); setFilterRole(""); loadUsers(); }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                    Reset
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
                {filtered.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">Nu există utilizatori</div>
                ) : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(user => (
                    <div key={user.username} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700"
                             onClick={() => navigate(`/user/${user.username}`)}>
                            {user.username?.[0]?.toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 truncate"
                               onClick={() => navigate(`/user/${user.username}`)}>{user.username}</p>
                            {edit !== user.username ? (
                                <p className="text-xs text-slate-400 capitalize"
                                   onClick={() => navigate(`/user/${user.username}`)}>
                                    {user.roles?.map(r => mapRoleToName(r.name)).join(", ")}
                                </p>
                            ) : (
                                <select
                                    defaultValue={user.roles[0]?.name}
                                    onChange={e => setPendingRole(e.target.value)}
                                    className="mt-1 rounded-xl border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                >
                                    {roles.map(r => (
                                        <option key={r.name} value={r.name}>{r.name.toLowerCase()}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {edit !== user.username ? (
                                <>
                                    {isAdminUser && (
                                        <button
                                            onClick={() => { setEdit(user.username); setPendingRole(user.roles[0]?.name ?? ""); }}
                                            className="rounded-xl bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                                        >
                                            Editare rol
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleRoleChange(user.id)}
                                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                                    >
                                        Salvare
                                    </button>
                                    <button
                                        onClick={() => setEdit(null)}
                                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                                    >
                                        Renunțare
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 shadow-sm">
                <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
            </div>

            <SuccessToast close={() => setShowSuccess(false)} message="Datele au fost salvate cu succes" show={showSuccess} />
            <ErrorToast close={() => setShowError(false)} message={error} show={showError} />
        </div>
    );
}
