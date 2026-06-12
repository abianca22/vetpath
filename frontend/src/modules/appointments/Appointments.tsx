// import { useContext, useEffect, useState } from "react";
// import { FormSelect } from "react-bootstrap";
// import AddAppointmentForm from "../../pages/AddAppointmentForm.tsx";
// import CancelAppointmentForm from "../../components/CancelAppointmentForm.tsx";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { DatePicker } from "rsuite";
// import moment from "moment/moment";
// import { isPetOwner, isVeterinarian } from "../../api/roles.ts";
// import SuccessToast from "../../components/SuccessToast.tsx";
// import ErrorToast from "../../components/ErrorToast.tsx";
// import {AuthContext} from "../../api/authContext.ts";
// import {getAllClinics, getAppointments} from "../../api/api.ts";
//
// export default function Appointments() {
//     const auth = useContext(AuthContext);
//     const navigate = useNavigate();
//     const [searchParams, setSearchParams] = useSearchParams();
//     const [showFilters, setShowFilters] = useState(false);
//     const [appointments, setAppointments] = useState([]);
//     const [clinics, setClinics] = useState([]);
//     const [error, setError] = useState(null);
//
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [showCancelModal, setShowCancelModal] = useState(false);
//     const [currentAppointment, setCurrentAppointment] = useState(null);
//
//     const [closeCount, setCloseCount] = useState(0);
//     const [cancelCloseCount, setCancelCloseCount] = useState(0);
//
//     const [startDate, setStartDate] = useState<Date | null>(null);
//     const [endDate, setEndDate] = useState<Date | null>(null);
//
//     const [lastVet, setLastVet] = useState("");
//     const [lastPet, setLastPet] = useState("");
//     const [lastOwner, setLastOwner] = useState("");
//     const [lastAppStatus, setLastAppStatus] = useState("");
//     const [lastClinic, setLastClinic] = useState("");
//
//     const [showSuccess, setShowSuccess] = useState(false);
//     const [successMessage, setSuccessMessage] = useState("");
//
//     const openAddModal = () => setShowAddModal(true);
//     const openCancelModal = () => setShowCancelModal(true);
//
//     const pastAppointment = (app) => {
//         const date = moment(
//             `${app.slot.split(" ")[0].split(".").reverse().join("-")} ${
//                 app.slot.split(" ")[1]
//             }`
//         );
//         return date.isSameOrBefore(moment());
//     };
//
//     useEffect(() => {
//         const findAppointments = async () => {
//             const res = await getAppointments(
//                 auth.token,
//                 null,
//                 null,
//                 null,
//                 null,
//                 null,
//                 null,
//                 null,
//                 null
//             );
//             setAppointments(res);
//         };
//
//         const findClinics = async () => {
//             const res = await getAllClinics(null, null);
//             setClinics(res);
//         };
//
//         findAppointments();
//         findClinics();
//     }, [closeCount, cancelCloseCount]);
//
//     async function handleFilterSubmit(e) {
//         e.preventDefault();
//
//         let start = null;
//         let end = null;
//
//         if (startDate) {
//             start = new Intl.DateTimeFormat("en-GB", {
//                 year: "numeric",
//                 month: "2-digit",
//                 day: "2-digit",
//             } as const)
//                 .format(startDate)
//                 .replaceAll("/", ".")
//                 .replace(", ", " ");
//         }
//
//         if (endDate) {
//             end = new Intl.DateTimeFormat("en-GB", {
//                 year: "numeric",
//                 month: "2-digit",
//                 day: "2-digit",
//             } as const)
//                 .format(endDate)
//                 .replaceAll("/", ".")
//                 .replace(", ", " ");
//         }
//
//         setSearchParams(
//             start && end
//                 ? { startDate: start, endDate: end }
//                 : start
//                     ? { startDate: start }
//                     : end
//                         ? { endDate: end }
//                         : {}
//         );
//
//         const formData = new FormData(e.target);
//
//         const vet = formData.get("vet");
//         const pet = formData.get("pet");
//         const owner = formData.get("owner");
//         const appStatus = formData.get("appStatus");
//         const clinic = formData.get("clinic");
//
//         setLastVet(vet?.toString() || "");
//         setLastPet(pet?.toString() || "");
//         setLastOwner(owner?.toString() || "");
//         setLastAppStatus(appStatus?.toString() || "");
//         setLastClinic(clinic?.toString() || "");
//
//         try {
//             const res = await getAppointments(
//                 auth.token,
//                 pet || null,
//                 owner || null,
//                 null,
//                 null,
//                 appStatus === "BOOKED" ? true : null,
//                 null,
//                 clinic || null,
//                 vet || null
//             );
//
//             setAppointments(res);
//             setError(null);
//         } catch (err) {
//             setError(err);
//             setAppointments([]);
//         }
//     }
//
//     return (
//         <div className="space-y-6">
//             {/* HEADER */}
//             <div className="flex items-center justify-between">
//                 <div>
//                     <h1 className="text-2xl font-semibold text-slate-900">
//                         Programări
//                     </h1>
//                     <p className="text-sm text-slate-500">
//                         Gestionarea programărilor din clinică
//                     </p>
//                 </div>
//
//                 <div className="flex gap-2">
//                     <button
//                         onClick={() => setShowFilters((v) => !v)}
//                         className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
//                     >
//                         Filtre
//                     </button>
//
//                     <button
//                         onClick={openAddModal}
//                         className="rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
//                     >
//                         + Programare
//                     </button>
//                 </div>
//             </div>
//
//             {/* FILTERS */}
//             {showFilters && (
//                 <form
//                     onSubmit={handleFilterSubmit}
//                     className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
//                 >
//                     <div className="grid gap-3 md:grid-cols-3">
//                         <DatePicker
//                             format="dd.MM.yyyy"
//                             value={startDate}
//                             onChange={setStartDate}
//                             placeholder="Start"
//                         />
//
//                         <DatePicker
//                             format="dd.MM.yyyy"
//                             value={endDate}
//                             onChange={setEndDate}
//                             placeholder="End"
//                         />
//
//                         <input
//                             className="rounded-xl border border-slate-200 px-3 py-2"
//                             placeholder="Pet name"
//                             value={lastPet}
//                             onChange={(e) => setLastPet(e.target.value)}
//                         />
//
//                         <input
//                             className="rounded-xl border border-slate-200 px-3 py-2"
//                             placeholder="Vet username"
//                             value={lastVet}
//                             onChange={(e) => setLastVet(e.target.value)}
//                         />
//
//                         <FormSelect
//                             value={lastClinic}
//                             onChange={(e) => setLastClinic(e.target.value)}
//                         >
//                             <option value="">Clinici</option>
//                             {clinics.map((c) => (
//                                 <option key={c.id} value={c.id}>
//                                     {c.name}
//                                 </option>
//                             ))}
//                         </FormSelect>
//
//                         <div className="flex gap-2">
//                             <button
//                                 type="submit"
//                                 className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
//                             >
//                                 Caută
//                             </button>
//
//                             <button
//                                 type="button"
//                                 onClick={() => {
//                                     setStartDate(null);
//                                     setEndDate(null);
//                                     setLastVet("");
//                                     setLastPet("");
//                                     setLastClinic("");
//                                     setSearchParams({});
//                                 }}
//                                 className="rounded-xl border border-slate-200 px-4 py-2"
//                             >
//                                 Reset
//                             </button>
//                         </div>
//                     </div>
//                 </form>
//             )}
//
//             {/* ERROR */}
//             {error && (
//                 <div className="text-sm text-red-500">
//                     {error.split?.("\n")?.map((e: string, i: number) => (
//                         <p key={i}>{e}</p>
//                     ))}
//                 </div>
//             )}
//
//             {/* APPOINTMENTS LIST (CARDS) */}
//             <div className="space-y-3 mt-6">
//                 {appointments.map((app) => (
//                     <div
//                         key={app.id}
//                         className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
//                     >
//                         <div className="flex items-center gap-4">
//                             <div className="h-10 w-10 rounded-full bg-emerald-100"/>
//
//                             <div>
//                                 <p className="font-semibold text-slate-900">
//                                     {app.pet.name}
//                                 </p>
//                                 <p className="text-sm text-slate-500">
//                                     {app.pet.owner.username}
//                                 </p>
//                             </div>
//
//                             <div className="ml-6 text-sm text-slate-600">
//                                 {app.slot}
//                             </div>
//
//                             <div className="ml-6 text-sm text-slate-500">
//                                 {app.vet.username}
//                             </div>
//                         </div>
//
//                         <div className="flex items-center gap-2">
//                             <button
//                                 onClick={() => {
//                                     sessionStorage.setItem("appointmentId", app.id);
//                                     navigate("/appointments/details");
//                                 }}
//                                 className="rounded-xl border px-3 py-1 text-sm hover:bg-slate-50"
//                             >
//                                 Detalii
//                             </button>
//
//                             <span
//                                 className={`rounded-full px-3 py-1 text-xs ${
//                                     app.status.includes("BOOKED")
//                                         ? "bg-emerald-50 text-emerald-700"
//                                         : "bg-red-50 text-red-600"
//                                 }`}
//                             >
//                               {app.status.includes("BOOKED") ? "Activă" : "Anulată"}
//                             </span>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//
//             {/* MODALS */}
//             <AddAppointmentForm
//                 showToast={() => {
//                     setShowSuccess(true);
//                     setSuccessMessage("Programarea a fost salvată");
//                 }}
//                 open={showAddModal}
//                 save={() => setCloseCount((p) => p + 1)}
//                 close={() => setShowAddModal(false)}
//                 reload={cancelCloseCount}
//                 appointments={appointments}
//             />
//
//             <CancelAppointmentForm
//                 showToast={() => {
//                     setShowSuccess(true);
//                     setSuccessMessage("Programarea a fost anulată");
//                 }}
//                 open={showCancelModal}
//                 save={() => setCancelCloseCount((p) => p + 1)}
//                 close={() => {
//                     setShowCancelModal(false);
//                     setCurrentAppointment(null);
//                 }}
//                 slot={currentAppointment}
//             />
//
//             <SuccessToast
//                 close={() => setShowSuccess(false)}
//                 show={showSuccess}
//                 message={successMessage}
//             />
//
//             <ErrorToast
//                 close={() => {
//                 }}
//                 show={!!error}
//                 message={error}
//             />
//         </div>
//     );
// }