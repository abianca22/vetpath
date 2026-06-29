import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import { getNotifications, updateNotifications } from "../api/api.ts";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { BellIcon } from "../components/Icons.tsx";

export default function NotificationsList() {
    const auth = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const res = await getNotifications(auth.token);
                setNotifications(res);
                if (auth.notifications.filter(n => !n.seen).length > 0) {
                    const seenRes = await updateNotifications(auth.token);
                    auth.setNotifications(seenRes);
                }
            } catch (err) {
                setError(err.message);
                setNotifications([]);
            }
        };
        loadNotifications();
    }, []);

    function getTimeStamp(date: string): string {
        const m = moment(`${date.split(" ")[0].split(".").reverse().join("-")} ${date.split(" ")[1]}`);
        if (moment().diff(m, "minutes") < 1) return `acum ${moment().diff(m, "seconds")} secunde`;
        if (moment().diff(m, "hours") < 1) return `acum ${moment().diff(m, "minutes")} minute`;
        if (moment().diff(m, "days") < 1) return `acum ${moment().diff(m, "hours")} ore`;
        return date;
    }

    const unseenCount = notifications.filter(n => !n.seen).length;

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Notificări</h1>
                    <p className="mt-0.5 text-sm text-slate-400">Activitatea recentă pe contul tău</p>
                </div>
                {unseenCount > 0 && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                        {unseenCount} noi
                    </span>
                )}
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <BellIcon size={36} className="opacity-30" />
                        <p className="mt-3 text-sm">Nu ai notificări</p>
                    </div>
                ) : notifications.map(notification => (
                    <div
                        key={notification.id}
                        onClick={() => {
                            if (notification.appointment) {
                                sessionStorage.setItem("appointmentId", notification.appointment.id.toString());
                                navigate("/appointments/details");
                            }
                        }}
                        className={`flex items-start gap-4 px-5 py-4 transition ${
                            notification.appointment ? "cursor-pointer hover:bg-slate-50" : ""
                        } ${!notification.seen ? "bg-emerald-50/40" : ""}`}
                    >
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            !notification.seen ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                        }`}>
                            <BellIcon size={16} />
                        </div>

\                        <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.seen ? "font-medium text-slate-800" : "text-slate-600"}`}>
                                {notification.content}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                                {getTimeStamp(notification.date)}
                            </p>
                        </div>

                        {!notification.seen && (
                            <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                Nou
                            </span>
                        )}

                        {notification.appointment && (
                            <span className="shrink-0 text-xs text-slate-400">→</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
