import { useContext, useEffect, useState } from "react";
import { FormSelect } from "react-bootstrap";
import AddAppointmentForm from "../../pages/AddAppointmentForm.tsx";
import CancelAppointmentForm from "../../components/CancelAppointmentForm.tsx";
import { useNavigate } from "react-router-dom";
import { DatePicker } from "rsuite";
import moment from "moment/moment";
import { isPetOwner, isVeterinarian } from "../../api/roles.ts";
import SuccessToast from "../../components/SuccessToast.tsx";
import ErrorToast from "../../components/ErrorToast.tsx";
import { AuthContext } from "../../api/authContext.ts";
import {getAllClinics, getAppointments, getAppointmentsByPet, sendEmail} from "../../api/api.ts";
import {
    ArrowUpDownIcon,
    BuildingSmallIcon,
    CalendarSmallIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    HeadphonesIcon,
    SlidersIcon,
    UserSmallIcon,
} from "../../components/Icons.tsx";

const PAGE_SIZE = 10;

function PetAvatar() {
    return (
        <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl border border-emerald-100">
                🐾
            </div>
        </div>
    );
}

function StatusBadge({ status, past, done }: { status: string; past: boolean; done?: boolean }) {
    if (status.includes("BOOKED")) {
        if (past) {
            return done
                ? <span className="rounded-full bg-blue-200 px-3 py-1 text-xs font-bold text-blue-600">Efectuată</span>
                : <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-500">Neefectuată</span>;
        }
        return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Activă</span>;
    }
    return <span className="rounded-full bg-red-200 px-3 py-1 text-xs font-bold text-red-500">Anulată</span>;
}

export default function Appointments() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const [showFilters, setShowFilters] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [error, setError] = useState<string | null>(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState(null);

    const [closeCount, setCloseCount] = useState(0);
    const [cancelCloseCount, setCancelCloseCount] = useState(0);

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [lastVet, setLastVet] = useState("");
    const [lastPet, setLastPet] = useState("");
    const [lastOwner, setLastOwner] = useState("");
    const [lastAppStatus, setLastAppStatus] = useState("");
    const [lastClinic, setLastClinic] = useState("");
    const [sortAsc, setSortAsc] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const activeFilterCount = [
        startDate, endDate,
        lastVet, lastPet, lastOwner, lastAppStatus, lastClinic,
    ].filter(Boolean).length;

    const pastAppointment = (app) => {
        const date = moment(
            `${app.slot.split(" ")[0].split(".").reverse().join("-")} ${app.slot.split(" ")[1]}`
        );
        return date.isSameOrBefore(moment());
    };

    useEffect(() => {
        const findAppointments = async () => {
            if (sessionStorage.getItem("petId") && sessionStorage.getItem("petName")) {
                setLastPet(sessionStorage.getItem("petName"));
                const res = await getAppointmentsByPet(auth.token, parseInt(sessionStorage.getItem("petId")));
                setAppointments(res);
                sessionStorage.removeItem("petId");
                sessionStorage.removeItem("petName");
            }
            else {
                const res = await getAppointments(auth.token, null, null, null, null, null, null, null, null);
                setAppointments(res);
            }
        };
        const findClinics = async () => {
            const res = await getAllClinics(null, null);
            setClinics(res);
        };
        findAppointments();
        findClinics();
        const loadPendingNotifications = async () => {
            if (sessionStorage.getItem("sendEmailAppointmentId") !== null) {
                try {
                    await sendEmail(auth.token, sessionStorage.getItem("sendEmailAppointmentId"));
                    sessionStorage.removeItem("sendEmailAppointmentId");
                    console.log("Email trimis");
                }
                catch(err) {
                    setError(err);
                }
            }
        }
        loadPendingNotifications();
    }, [closeCount, cancelCloseCount]);

    async function handleFilterSubmit(e) {
        e.preventDefault();
        let start: string | null = null;
        let end: string | null = null;
        const fmt = { year: "numeric", month: "2-digit", day: "2-digit" } as const;

        if (startDate) start = new Intl.DateTimeFormat("en-GB", fmt).format(startDate).replaceAll("/", ".").replace(", ", " ");
        if (endDate) end = new Intl.DateTimeFormat("en-GB", fmt).format(endDate).replaceAll("/", ".").replace(", ", " ");

        const formData = new FormData(e.target);
        const vet = formData.get("vet")?.toString() || "";
        const pet = formData.get("pet")?.toString() || "";
        const owner = formData.get("owner")?.toString() || "";
        const appStatus = formData.get("appStatus")?.toString() || "";
        const clinic = formData.get("clinic")?.toString() || "";

        setLastVet(vet); setLastPet(pet); setLastOwner(owner);
        setLastAppStatus(appStatus); setLastClinic(clinic);

        try {
            const res = await getAppointments(
                auth.token,
                pet || null, owner || null, start, end,
                appStatus === "BOOKED" ? true : (appStatus === 'CANCELLED' ? false : null),
                null, clinic || null, vet || null
            );
            setAppointments(res);
            setError(null);
            setCurrentPage(1);
        } catch (err) {
            setError(err);
            setAppointments([]);
        }
    }

    function resetFilters() {
        setStartDate(null); setEndDate(null);
        setLastVet(""); setLastPet(""); setLastOwner("");
        setLastAppStatus(""); setLastClinic("");
    }

    function goToDetails(appId: number) {
        sessionStorage.setItem("appointmentId", String(appId));
        navigate("/appointments/details");
    }

    const filtered = appointments
        .sort((a, b) => {
            const da = moment(`${a.slot.split(" ")[0].split(".").reverse().join("-")} ${a.slot.split(" ")[1]}`);
            const db = moment(`${b.slot.split(" ")[0].split(".").reverse().join("-")} ${b.slot.split(" ")[1]}`);
            return sortAsc ? da.diff(db) : db.diff(da);
        });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const endIdx = Math.min(currentPage * PAGE_SIZE, filtered.length);

    function parseSlot(slot: string) {
        if (!slot) return { date: "—", time: "—" };
        const [datePart, timePart] = slot.split(" ");
        if (!datePart) return { date: slot, time: "" };
        const [day, month, year] = datePart.split(".");
        const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthName = months[parseInt(month) - 1] ?? month;
        return { date: `${parseInt(day)} ${monthName} ${year}`, time: timePart ?? "" };
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Programări</h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                    <span className="text-base leading-none">+</span>
                    Programare nouă
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex justify-content-start gap-3">
                        <button
                            type="button"
                            onClick={() => setShowFilters((v) => !v)}
                            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            <SlidersIcon />
                            Filtrează
                            <ChevronDownIcon className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
                        </button>

                        <button
                            type="button"
                            onClick={() => { setSortAsc((v) => !v); setCurrentPage(1); }}
                            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            <ArrowUpDownIcon />
                            Sortare {sortAsc ? "↑" : "↓"}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <SlidersIcon size={14} />
                        <span>{activeFilterCount} filtre active</span>
                    </div>
                </div>

                {showFilters && (
                    <form onSubmit={handleFilterSubmit} className="mt-4 border-t border-slate-100 pt-4">
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">De la</label>
                                <DatePicker
                                    format="dd.MM.yyyy"
                                    value={startDate}
                                    onChange={setStartDate}
                                    placeholder="Start"
                                    style={{ width: "100%" }}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Până la</label>
                                <DatePicker
                                    format="dd.MM.yyyy"
                                    value={endDate}
                                    onChange={setEndDate}
                                    placeholder="End"
                                    style={{ width: "100%" }}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Animal</label>
                                <input
                                    name="pet"
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                    placeholder="Numele animalului"
                                    value={lastPet}
                                    onChange={(e) => setLastPet(e.target.value)}
                                />
                            </div>
                            {!isVeterinarian(auth?.user?.roles) && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-slate-500">Veterinar</label>
                                    <input
                                        name="vet"
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                        placeholder="Username vet"
                                        value={lastVet}
                                        onChange={(e) => setLastVet(e.target.value)}
                                    />
                                </div>
                            )}
                            {!isPetOwner(auth?.user?.roles) && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-slate-500">Proprietar</label>
                                    <input
                                        name="owner"
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                        placeholder="Username proprietar"
                                        value={lastOwner}
                                        onChange={(e) => setLastOwner(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Status</label>
                                <FormSelect
                                    name="appStatus"
                                    value={lastAppStatus}
                                    onChange={(e) => setLastAppStatus(e.target.value)}
                                    className="rounded-xl border-slate-200 text-sm"
                                >
                                    <option value="">Toate</option>
                                    <option value="BOOKED">Active</option>
                                    <option value="CANCELLED">Anulate</option>
                                </FormSelect>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-slate-500">Clinică</label>
                                <FormSelect
                                    name="clinic"
                                    value={lastClinic}
                                    onChange={(e) => setLastClinic(e.target.value)}
                                    className="rounded-xl border-slate-200 text-sm"
                                >
                                    <option value="">Toate</option>
                                    {clinics.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </FormSelect>
                            </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button
                                type="submit"
                                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                            >
                                Aplică filtre
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                            >
                                Resetare
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

                <div className="divide-y divide-slate-100">
                    {error && (
                        <div className="px-5 py-4 text-sm text-red-500">
                            {String(error).split?.("\n")?.map((e, i) => <p key={i}>{e}</p>)}
                        </div>
                    )}

                    {paginated.length === 0 && !error && (
                        <div className="px-5 py-10 text-center text-sm text-slate-400">
                            Nu există programări
                        </div>
                    )}

                    {paginated.map((app) => {
                        const { date, time } = parseSlot(app.slot);
                        const past = pastAppointment(app);

                        return (
                            <div
                                key={app.id}
                                onClick={() => goToDetails(app.id)}
                                className="flex items-center gap-5 px-5 py-4 cursor-pointer transition-colors hover:bg-slate-50"
                            >
                                <PetAvatar />

                                <div className="w-32 min-w-0">
                                    <p className="truncate font-semibold text-slate-800">
                                        {app.pet?.name ?? <em>Animal șters</em>}
                                    </p>
                                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400">
                                        <UserSmallIcon />
                                        {app.currentOwner?.username ?? app.pet?.owner?.username ?? <em>Utilizator inactiv</em>}
                                    </p>
                                </div>

                                <div className="w-36 min-w-0 space-y-0.5">
                                    <p className="flex items-center gap-1.5 text-sm text-slate-600">
                                        <CalendarSmallIcon />
                                        {date}
                                    </p>
                                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <ClockIcon />
                                        {time} · 30 min
                                    </p>
                                </div>

                                <div className="flex-1 min-w-0 space-y-0.5">
                                    <p className="flex items-center gap-1.5 text-sm text-slate-600">
                                        <HeadphonesIcon />
                                        {app.vet?.username ?? <em>Utilizator inactiv</em>}
                                    </p>
                                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <BuildingSmallIcon />
                                        {app.clinic?.name ?? <em>Clinică ianctivă</em>}
                                    </p>
                                </div>

                                <div className="w-36">
                                <div className="row flex items-center">

                                    <div className="col-9 flex justify-content-center">
                                        <StatusBadge status={app.status} past={past} done={app.done}/>
                                    </div>
                                    <div className="col-3 flex justify-content-end">
                                        <ChevronRightIcon className="shrink-0 text-slate-300" />
                                    </div>
                                </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                    <p className="text-sm text-slate-400">
                        {filtered.length === 0
                            ? "0 programări"
                            : `Se afișează ${startIdx}–${endIdx} din ${filtered.length} programări`}
                    </p>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeftIcon />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                                    page === currentPage
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                                }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronRightIcon />
                        </button>
                    </div>
                </div>
            </div>

            <AddAppointmentForm
                showToast={() => { setShowSuccess(true); setSuccessMessage("Programarea a fost salvată"); }}
                open={showAddModal}
                save={() => { setCloseCount((p) => p + 1); setShowAddModal(false); }}
                close={() => setShowAddModal(false)}
                reload={cancelCloseCount}
                appointments={appointments}
            />

            <CancelAppointmentForm
                showToast={() => { setShowSuccess(true); setSuccessMessage("Programarea a fost anulată"); }}
                open={showCancelModal}
                save={() => { setCancelCloseCount((p) => p + 1); setShowCancelModal(false); setCurrentAppointment(null); }}
                close={() => { setShowCancelModal(false); setCurrentAppointment(null); }}
                slot={currentAppointment}
            />

            <SuccessToast close={() => setShowSuccess(false)} show={showSuccess} message={successMessage} />
            <ErrorToast close={() => setError(null)} show={!!error} message={error} />
        </div>
    );
}
