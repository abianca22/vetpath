import {type ReactNode, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../api/authContext";
import { isAdmin, isVeterinarian } from "../api/roles";

type Props = {
    children: ReactNode;
};

export default function AppLayout({ children }: Props) {
    const auth = useContext(AuthContext);
    const location = useLocation();

    const navItems = [
        { label: "Appointments", path: "/appointments" },
        { label: "Pets", path: `/pets${auth.user ? `/${auth.user.username}` : ""}` },
        { label: "Clinics", path: "/clinics" },
        { label: "AI Assistant", path: "/ask" },
    ];

    if (auth.user && isVeterinarian(auth.user.roles)) {
        navItems.push({
            label: "Schedule",
            path: "/slots",
        });
    }

    if (auth.user && isAdmin(auth.user.roles)) {
        navItems.push(
            {
                label: "Users",
                path: "/users",
            },
            {
                label: "Requests",
                path: "/requests-list",
            }
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="flex">
                <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-lime-100 lg:flex">
                    <div className="border-b border-slate-200 p-6">
                        <Link
                            to="/"
                            className="text-green-500 text-2xl font-bold tracking-tight text-decoration-none"
                        >
                            VetPath
                        </Link>
                    </div>

                    <nav className="flex flex-1 flex-col gap-1 p-4">
                        {navItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                                        isActive
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="border-t border-slate-200 p-4">
                        <button
                            onClick={() => auth.logout()}
                            className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                        >
                            Logout
                        </button>
                    </div>
                </aside>

                <main className="flex-1">
                    <header className="sticky top-0 z-10 border-b border-slate-200 bg-gray-50 backdrop-blur">
                        <div className="flex items-center justify-between px-6 py-4">
                            <div>
                                <h1 className="text-lg font-semibold">
                                    Bine ai revenit
                                </h1>
                                <p className="text-sm text-slate-500">
                                    {auth.user?.username}
                                </p>
                            </div>
                        </div>
                    </header>

                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}