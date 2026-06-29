import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import { deleteSlot, findUserByUsername, getSlots } from "../api/api.ts";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import AddSlotForm from "./AddSlotForm.tsx";
import { DatePicker } from "rsuite";
import { isVeterinarian } from "../api/roles.ts";
import Confirm from "../components/Confirm.tsx";
import moment from "moment";
import { CalendarSmallIcon, ClockIcon, BuildingSmallIcon, HeadphonesIcon, ChevronDownIcon } from "../components/Icons.tsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCalendarDays} from "@fortawesome/free-regular-svg-icons";
import SuccessToast from "../components/SuccessToast.tsx";
import ErrorToast from "../components/ErrorToast.tsx";
import Pagination from "../components/Pagination.tsx";

const PAGE_SIZE = 10;

export default function SlotsList() {
    const auth = useContext(AuthContext);

    // rawSlots = tot ce vine din API (fără CANCELLED)
    const [rawSlots, setRawSlots] = useState([]);
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [showAddModal, setShowAddModal] = useState(false);
    const [closeCount, setCloseCount] = useState(0);
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [currentSlotId, setCurrentSlotId] = useState(null);
    const [statusFilter, setStatusFilter] = useState("TOATE");
    const [showFilters, setShowFilters] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [page, setPage] = useState(1);

    const isOwnSlots = !params.username || params.username === auth.user.username;

    const slots = rawSlots.filter(s => {
        if (statusFilter === "LIBER") return s.status.includes("AVAILABLE");
        if (statusFilter === "OCUPAT") return !s.status.includes("AVAILABLE");
        return true;
    });

    function expiredSlot(s) {
        return moment(`${s.slot.split(" ")[0].split(".").reverse().join("-")} ${s.slot.split(" ")[1]}`).isSameOrBefore(moment());
    }

    const formatDate = (slot: string) => {
        if (!slot) return { date: "—", time: "—" };
        const [datePart, timePart] = slot.split(" ");
        const [day, month, year] = datePart.split(".");
        const months = ["Ian","Feb","Mar","Apr","Mai","Iun","Iul","Aug","Sep","Oct","Nov","Dec"];
        return {
            date: `${parseInt(day)} ${months[parseInt(month)-1]} ${year}`,
            time: timePart ?? ""
        };
    };

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    async function loadSlots(startDate?: string, endDate?: string) {
        try {
            const username = params.username ?? auth.user.username;
            const from = startDate ?? (searchParams.get("startDate") ?? moment().format("DD.MM.YYYY HH:mm"));
            const res = await getSlots(auth.token, username, true, from, endDate ?? searchParams.get("endDate"), false);
            if (!mountedRef.current) return;
            setRawSlots((res ?? []).filter(s => !s.status.includes("CANCELLED")));
            setError(null);
        } catch (err) {
            if (mountedRef.current) setError(err.message);
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        const fmt = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false } as const;
        const startDate = start ? new Intl.DateTimeFormat("en-GB", fmt).format(start).replaceAll("/", ".").replace(", ", " ") : null;
        const endDate = end ? new Intl.DateTimeFormat("en-GB", fmt).format(end).replaceAll("/", ".").replace(", ", " ") : null;

        if (start && end && start > end) { setError("Data de final nu poate fi mai mică decât cea de start!"); return; }

        setPage(1);
        setSearchParams(startDate && endDate ? { startDate, endDate } : startDate ? { startDate } : endDate ? { endDate } : {});
        loadSlots(startDate, endDate);
    }

    async function handleDelete(id) {
        try {
            await deleteSlot(auth.token, id);
            setSuccessMessage("Slotul a fost șters");
            setShowSuccess(true);
        } catch (err) {
            setError(err.message);
            setShowError(true);
        }
    }

    useEffect(() => {
        const loadFilters = async () => {
            if (searchParams.get("startDate")) {
                const parts = searchParams.get("startDate").split(" ");
                const dateParts = parts[0].split(".").reverse();
                const timeParts = parts[1]?.split(":") ?? ["0", "0"];
                setStart(new Date(+dateParts[0], +dateParts[1] - 1, +dateParts[2], +timeParts[0], +timeParts[1]));
            }
            if (searchParams.get("endDate")) {
                const parts = searchParams.get("endDate").split(" ");
                const dateParts = parts[0].split(".").reverse();
                const timeParts = parts[1]?.split(":") ?? ["0", "0"];
                setEnd(new Date(+dateParts[0], +dateParts[1] - 1, +dateParts[2], +timeParts[0], +timeParts[1]));
            }
            if (params.username) {
                findUserByUsername(auth.token, params.username).then(res => {
                    if (!isVeterinarian(res.roles)) navigate("/access-denied");
                });
            }
            loadSlots();
        }
        loadFilters();
    }, [params, closeCount]);

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Program</h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isOwnSlots ? "Sloturile tale de disponibilitate" : `Program veterinar: ${params.username}`}
                    </p>
                </div>
                {isOwnSlots && (
                    <button onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                        + Adaugă slot
                    </button>
                )}
            </div>


            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <button type="button" onClick={() => setShowFilters(v => !v)}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                        Filtrează
                        <ChevronDownIcon className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
                    </button>
                    <div className="flex gap-2">
                        {(["TOATE", "LIBER", "OCUPAT"] as const).map(s => (
                            <button key={s} type="button" onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                    statusFilter === s
                                        ? s === "LIBER" ? "bg-emerald-600 text-white"
                                            : s === "OCUPAT" ? "bg-slate-700 text-white"
                                            : "bg-slate-200 text-slate-700"
                                        : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                                }`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {showFilters && (
                    <form onSubmit={handleSearch} className="mt-4 border-t border-slate-100 pt-4">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">De la</label>
                                <DatePicker format="dd.MM.yyyy HH:mm" value={start} placeholder="Început" onChange={setStart} style={{ width: 200 }} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Până la</label>
                                <DatePicker format="dd.MM.yyyy HH:mm" value={end} placeholder="Final" onChange={setEnd} style={{ width: 200 }} />
                            </div>
                            <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                                Aplică
                            </button>
                            <button type="button" onClick={() => { setStart(null); setEnd(null); setSearchParams({}); loadSlots(); }}
                                className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                                Reset
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {slots.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-slate-400 shadow-sm">
                    <span className="text-4xl"><FontAwesomeIcon icon={faCalendarDays} size="2x" className="text-emerald-700"/></span>
                    <p className="mt-3 text-sm">Nu există sloturi pentru filtrele selectate</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
                    {slots.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(slot => {
                        const { date, time } = formatDate(slot.slot);
                        const isAvailable = slot.status.includes("AVAILABLE");
                        const canDelete = isOwnSlots && isAvailable && !expiredSlot(slot);

                        return (
                            <div
                                key={slot.id}
                                onClick={() => {
                                    if (!isAvailable) {
                                        sessionStorage.setItem("appointmentId", slot.id);
                                        navigate("/appointments/details");
                                    }
                                }}
                                className={`flex items-center gap-5 px-5 py-3.5 transition ${!isAvailable ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50/50"}`}
                            >
                                <div className="flex items-center gap-1.5 w-44 shrink-0">
                                    <CalendarSmallIcon className="text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700">{date}</span>
                                </div>
                                <div className="flex items-center gap-1.5 w-16 shrink-0">
                                    <ClockIcon className="text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700">{time}</span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <HeadphonesIcon className="text-slate-400" />
                                    <span className="text-sm text-slate-600 truncate">{slot.vet?.username}</span>
                                </div>

                                    <div className="w-fit">
                                {slot.clinic?.name && (
                                    <div className="flex items-center gap-1.5 w-40 min-w-0">
                                        <BuildingSmallIcon className="text-slate-400" />
                                        <span className="text-sm text-slate-500 truncate">{slot.clinic.name}</span>
                                    </div>
                                )}
                                    </div>
                                <div className="w-80 flex justify-content-center">
                                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                                    isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                                }`}>
                                    {isAvailable ? "Liber" : "Ocupat"}
                                </span>
                                    </div>
                                <div className="w-64 flex justify-content-end">
                                {canDelete && (
                                    <button
                                        onClick={e => { e.stopPropagation(); setCurrentSlotId(slot.id); setShowConfirmDialog(true); }}
                                        className="shrink-0 rounded-xl bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 transition">
                                        Ștergere
                                    </button>
                                )}
                                </div>
                                <div className="w-28 flex justify-content-end">
                                        {!isAvailable && <span className="shrink-0 text-slate-300 text-sm">→</span>}
                                </div>
                            </div>
                        );
                    })}
                    <div className="px-5">
                        <Pagination total={slots.length} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
                    </div>
                </div>
            )}

            <AddSlotForm open={showAddModal} save={() => { setShowAddModal(false); setCloseCount(p => p + 1); setSuccessMessage("Slotul a fost adăugat"); setShowSuccess(true); }} close={() => setShowAddModal(false)} />
            <Confirm
                open={showConfirmDialog}
                close={() => setShowConfirmDialog(false)}
                confirm={() => { handleDelete(currentSlotId); setCurrentSlotId(null); setCloseCount(p => p + 1); }}
                message="Doriți să eliminați acest slot?"
            />
            <SuccessToast show={showSuccess} close={() => setShowSuccess(false)} message={successMessage} />
            <ErrorToast show={showError} close={() => setShowError(false)} message={error} />
        </div>
    );
}
