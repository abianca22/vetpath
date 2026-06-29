import { type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalShellProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    /** Butoane footer — de obicei Anulare + Salvare */
    footer?: ReactNode;
    /** Lățime maximă, default 520px */
    maxWidth?: number;
}

const inputBase: React.CSSProperties = {
    width: "100%",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 14,
    color: "#0f172a",
    background: "#f8fafc",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color .15s, box-shadow .15s",
    boxSizing: "border-box",
};

const labelBase: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 5,
};

/** Buton primar verde */
export function PrimaryBtn({ children, onClick, type = "button", form }: { children: ReactNode, onClick?: () => void, type?: "button" | "submit" | "reset", form?: string}) {
    return (
        <button
            type={type}
            form={form}
            onClick={onClick}
            style={{
                background: "#1d9e75",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "9px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background .15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#166b50")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1d9e75")}
        >
            {children}
        </button>
    );
}

/** Buton secundar outlined */
export function SecondaryBtn({ children, onClick }: { children: ReactNode, onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                background: "transparent",
                color: "#475569",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                padding: "9px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background .15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
            {children}
        </button>
    );
}

/** Input text stilizat */
export function VetInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            style={{ ...inputBase, ...props.style }}
            onFocus={e => { e.currentTarget.style.borderColor = "#1d9e75"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(29,158,117,0.12)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
        />
    );
}

/** Select stilizat */
export function VetSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className={`vet-select ${props.className ?? ""}`}
            style={{
                ...inputBase,
                cursor: "pointer",
                ...props.style,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "#1d9e75"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
        />
    );
}

/** Label stilizat */
export function VetLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
    return <label htmlFor={htmlFor} style={labelBase}>{children}</label>;
}

/** Grup formular: label + input/select */
export function Field({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <VetLabel htmlFor={htmlFor}>{label}</VetLabel>
            {children}
        </div>
    );
}

/** Mesaj eroare */
export function ErrorMsg({ error }: { error: string | null }) {
    if (!error) return null;
    return (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#dc2626", marginBottom: 4 }}>
            {error.split("\n").filter(Boolean).map((e, i) => <p key={i} style={{ margin: 0 }}>{e}</p>)}
        </div>
    );
}

/** Modal wrapper principal */
export default function ModalShell({ open, onClose, title, children, footer, maxWidth = 520 }: ModalShellProps) {
    if (!open) return null;

    return createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            {/* backdrop */}
            <div
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(2px)" }}
            />
            {/* card */}
            <div style={{
                position: "relative",
                zIndex: 1,
                background: "#fff",
                borderRadius: 20,
                width: "100%",
                maxWidth,
                boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
                fontFamily: "Inter, system-ui, sans-serif",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
            }}>
                {/* header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, borderRadius: 8, display: "flex", alignItems: "center" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* body */}
                <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                    {children}
                </div>
                {/* footer */}
                {footer && (
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
