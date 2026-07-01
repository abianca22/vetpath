import { type ReactNode, useContext } from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import { AuthContext } from "../api/authContext";
import {isAdmin, isPetOwner, isVeterinarian} from "../api/roles";
import {
    BellIcon,
    BuildingIcon,
    CalendarIcon,
    ClipboardIcon,
    FileTextIcon,
    LogOutIcon,
    PawIcon,
    ScheduleIcon,
    SparklesIcon,
    UsersIcon,
} from "../components/Icons";

type NavItem = {
    label: string;
    path: string;
    icon: ReactNode;
    badge?: number;
};

type Props = {
    children: ReactNode;
};

export default function AppLayout({ children }: Props) {
    const auth = useContext(AuthContext);
    const location = useLocation();

    const unseenCount = auth?.notifications?.filter((n) => !n.seen).length ?? 0;
    const role = auth?.user?.roles?.[0]?.name === 'VETERINARIAN' ? 'VETERINAR' : (auth?.user?.roles?.[0]?.name === 'PET_OWNER' ? 'CLIENT' : (auth?.user?.roles?.[0]?.name === 'ADMIN' ? 'ADMIN' : ''));
    const navigate = useNavigate();

    const navItems: NavItem[] = [
        { label: "Programări", path: "/appointments", icon: <CalendarIcon /> },
        {
            label: "Animale",
            path: `/pets${role === "CLIENT" ? `/${auth.user.username}` : ""}`,
            icon: <PawIcon />,
        },
        { label: "Clinici", path: "/clinics", icon: <BuildingIcon /> },
        { label: "Asistență", path: "/ask", icon: <SparklesIcon /> },
        { label: "Rapoarte", path: "/records", icon: <FileTextIcon /> },
    ];

    if (auth?.user && isVeterinarian(auth.user.roles)) {
        navItems.push({ label: "Program", path: "/slots", icon: <ScheduleIcon /> },
            { label: "Utilizatori", path: "/users", icon: <UsersIcon /> });
    }
    if (auth?.user && isPetOwner(auth.user.roles)) {
        navItems.push(
            { label: "Personal medical", path: "/users", icon: <UsersIcon /> });
    }

    if (auth?.user && isAdmin(auth.user.roles)) {
        navItems.push(
            { label: "Utilizatori", path: "/users", icon: <UsersIcon /> },
            { label: "Cereri", path: "/requests-list", icon: <ClipboardIcon /> }
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F8F4] text-slate-900">
            <div className="flex">
                {/* ── SIDEBAR ── */}
                <aside className="sticky top-0 h-screen w-64 flex flex-col border-r border-emerald-100 bg-[#F8FBF8]">
                    {/* Logo */}
                    <div className="border-b border-slate-100 px-6 py-6">
                        <Link to="/profile" className="flex items-center gap-2.5 no-underline">
                            <span className="text-2xl leading-none">🐾</span>
                            <span className="text-xl font-bold tracking-tight text-emerald-700">
                                VetPath
                            </span>
                        </Link>
                    </div>

                    {/* Nav links */}
                    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5">
                        {navItems.map((item) => {
                            const isActive =
                                item.path === "/pets" || item.path.startsWith("/pets/")
                                    ? location.pathname.startsWith("/pets")
                                    : location.pathname.startsWith(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all no-underline ${
                                        isActive
                                            ? "border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm"
                                            : "text-slate-500 hover:bg-white hover:text-slate-700"
                                    }`}
                                >
                                    <span
                                        className={
                                            isActive ? "text-emerald-600" : "text-slate-400"
                                        }
                                    >
                                        {item.icon}
                                    </span>
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge != null && item.badge > 0 && (
                                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User info + logout */}
                    <div className="border-t border-slate-100 p-4 space-y-2 hover:cursor-pointer">
                        <div className="flex items-center gap-3 px-1 py-1">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                                {auth?.user?.username?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div className="min-w-0" onClick={() => navigate("/profile")}>
                                <div className="truncate text-sm font-semibold text-slate-800">
                                    {auth?.user?.username}
                                </div>
                                <div className="truncate text-xs capitalize text-slate-400">
                                    {role}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => auth?.logout()}
                            className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-red-50 hover:text-red-600"
                        >
                            <LogOutIcon />
                            Logout
                        </button>
                    </div>
                </aside>

                {/* ── MAIN ── */}
                <main className="flex min-h-screen flex-1 flex-col">
                    {/* Top header */}
                    <header className="sticky top-0 z-10 border-b border-emerald-100 bg-[#F8FBF8] backdrop-blur">
                        <div className="flex items-center justify-between px-6 py-3">
                            <div>
                                {
                                    location.pathname.startsWith("/profile") &&
                                <div className="text-base font-semibold text-slate-800">
                                    Bine ai revenit, {auth?.user?.username} 👋
                                </div>
                                }
                            </div>

                            <Link
                                to="/notifications"
                                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 no-underline transition hover:bg-emerald-50 hover:text-emerald-700"
                            >
                                <BellIcon size={18} />
                                {unseenCount > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-bold text-white">
                                        {unseenCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </header>

                    {/* Page content */}
                    <div className="mx-auto w-full max-w-7xl flex-1 p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
