import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import {getAllClinics, getVeterinarians} from "../api/api.ts";
import keycloak from "../api/keycloak.ts";

export default function LandingPage() {
    const auth = useContext(AuthContext);
    const [clinics, setClinics] = useState([]);
    const [vets, setVets] = useState([]);

    useEffect(() => {
        getAllClinics(null, null).then(setClinics).catch(() => setClinics([]));
        getVeterinarians().then(setVets).catch(() => setVets([]));
    }, []);

    const handleLogin = () => auth?.login();
    const handleRegister = () => keycloak.register();

    return (
        <div className="min-h-screen bg-white" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

            <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
                <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-8 h-16">
                    <a href="#" className="flex items-center gap-2 no-underline" style={{ color: "#1d9e75", fontWeight: 700, fontSize: 18 }}>
                        🐾 VetPath
                    </a>

                    <nav className="flex items-center gap-8">
                        {[["#despre", "Despre noi"], ["#medici", "Medici veterinari"], ["#clinici", "Clinici"]].map(([href, label]) => (
                            <a key={href} href={href}
                                className="text-sm font-medium text-slate-500 no-underline transition-colors hover:text-emerald-600">
                                {label}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <button onClick={handleLogin}
                            className="bg-transparent border-none cursor-pointer text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors px-1">
                            Autentificare
                        </button>
                        <button onClick={handleRegister}
                            className="rounded-xl border-none cursor-pointer px-4 py-2 text-sm font-semibold text-white transition-colors"
                            style={{ background: "#1d9e75" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#166b50")}
                            onMouseLeave={e => (e.currentTarget.style.background = "#1d9e75")}>
                            Înregistrare
                        </button>
                    </div>
                </div>
            </header>

            <section className="mx-auto max-w-screen-2xl px-8 py-20 flex items-center justify-between" id="despre">
                <div className="mx-auto flex-1">
                    <div className="d-flex justify-content-center">
                    <h1 className="text-5xl font-extrabold leading-tight text-slate-900 mb-5" style={{ lineHeight: 1.15 }}>
                        Grijă completă<br />
                        pentru <span style={{ color: "#1d9e75" }}>animalele tale</span><br />
                    </h1>
                    </div>
                    <div className="d-flex justify-content-center">
                    <p className="text-base leading-relaxed text-slate-500 mb-8" style={{ maxWidth: 480 }}>
                        Găsește cei mai buni medici veterinari și clinici, programează consultații
                        și ai grijă de sănătatea animalului tău, simplu și rapid.
                    </p>
                    </div>
                    <div className="flex gap-5 flex-wrap justify-content-center">
                        <button onClick={handleLogin}
                            className="rounded-xl border-none cursor-pointer px-7 py-3 text-sm font-semibold text-white"
                            style={{ background: "#1d9e75", boxShadow: "0 2px 8px rgba(29,158,117,0.25)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#166b50")}
                            onMouseLeave={e => (e.currentTarget.style.background = "#1d9e75")}>
                            Intră în cont
                        </button>
                        <button onClick={handleRegister}
                            className="rounded-xl cursor-pointer px-7 py-3 text-sm font-semibold text-slate-700 bg-white transition-colors hover:bg-slate-50"
                            style={{ border: "1.5px solid #e2e8f0" }}>
                            Creează cont
                        </button>
                    </div>
                </div>
                <div className="mx-auto px-8 py-16">
                    {[
                        { icon: "📅", title: "Programări online", desc: "Rezervă o consultație la clinica preferată în câteva clicuri, oricând." },
                        { icon: "📋", title: "Rapoarte medicale", desc: "Istoricul complet al consultațiilor, accesibil oricând pentru tine și medicul veterinar." },
                    ].map(f => (
                        <div key={f.title} className="flex gap-4 items-start p-6">
                            <div className="flex-shrink-0 flex items-center justify-center rounded-xl text-xl"
                                 style={{ width: 44, height: 44, background: "#e1f5ee", border: "1px solid #a7f3d0" }}>
                                {f.icon}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800 m-0 mb-1" style={{ fontSize: 15 }}>{f.title}</p>
                                <p className="text-sm text-slate-500 m-0" style={{ lineHeight: 1.6 }}>{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>


            <section id="medici" className="border-t border-slate-100" style={{ background: "#f8fafc" }}>
                <div className="mx-auto max-w-screen-xl px-8 py-16">
                    <div className="flex justify-between items-end mb-7">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 m-0 mb-1">Medici veterinari</h2>
                            <p className="text-sm text-slate-400 m-0">Specialiști dedicați animalelor tale</p>
                        </div>
                        <button onClick={handleLogin}
                            className="bg-transparent border-none cursor-pointer text-sm font-medium"
                            style={{ color: "#1d9e75" }}>
                            Vezi toți →
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {vets.length === 0
                            ? [1, 2, 3, 4].map(i => (
                                <div key={i} className="rounded-2xl bg-white" style={{ height: 100, border: "1px solid #f1f5f9" }} />
                            ))
                            : vets.slice(0, 4).map(vet => (
                                <div key={vet.id} onClick={handleLogin}
                                    className="rounded-2xl bg-white cursor-pointer p-5"
                                    style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                                    <div className="flex items-center justify-center rounded-full font-bold text-white mb-3"
                                        style={{ width: 40, height: 40, background: "#1d9e75", fontSize: 16 }}>
                                        {vet.username?.[0]?.toUpperCase() ?? "V"}
                                    </div>
                                    <p className="font-semibold text-slate-800 m-0 mb-0.5 truncate" style={{ fontSize: 14 }}>{vet.username}</p>
                                    <p className="text-xs text-slate-400 m-0">Medic veterinar</p>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </section>

            <section id="clinici" className="mx-auto max-w-screen-xl px-8 py-16">
                <div className="flex justify-between items-end mb-7">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 m-0 mb-1">Clinici disponibile</h2>
                        <p className="text-sm text-slate-400 m-0">Partenerii noștri veterinari</p>
                    </div>
                    <button onClick={handleLogin}
                            className="bg-transparent border-none cursor-pointer text-sm font-medium"
                            style={{ color: "#1d9e75" }}>
                        Vezi toate →
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {clinics.length === 0
                        ? [1, 2, 3, 4].map(i => (
                            <div key={i} className="rounded-2xl" style={{ height: 120, background: "#f1f5f9", border: "1px solid #f1f5f9" }} />
                        ))
                        : clinics.slice(0, 4).map(clinic => (
                            <div key={clinic.id} onClick={handleLogin}
                                 className="rounded-2xl bg-white cursor-pointer transition-shadow hover:shadow-md p-5"
                                 style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                                <div className="flex items-center justify-center rounded-xl text-xl mb-3"
                                     style={{ width: 40, height: 40, background: "#e1f5ee", border: "1px solid #a7f3d0" }}>🏥</div>
                                <p className="font-semibold text-slate-800 m-0 mb-1 truncate" style={{ fontSize: 14 }}>{clinic.name}</p>
                                {clinic.address && <p className="text-xs text-slate-400 m-0 truncate">{clinic.address}</p>}
                            </div>
                        ))
                    }
                </div>
            </section>
        </div>
    );
}
