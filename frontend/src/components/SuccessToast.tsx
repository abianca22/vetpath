import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function SuccessToast({ show, message, close }: { show: boolean; message?: string | null; close: () => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const openToast = () => {
            if (show) {
                setVisible(true);
                const t = setTimeout(() => {
                    setVisible(false);
                    close();
                }, 4000);
                return () => clearTimeout(t);
            }
        }
        openToast();
    }, [show]);

    if (!visible) return null;

    return createPortal(
        <div
            style={{
                position: "fixed", top: 20, right: 20, zIndex: 9999,
                display: "flex", alignItems: "flex-start", gap: 12,
                background: "#fff", border: "1px solid #a7f3d0",
                borderLeft: "4px solid #1d9e75",
                borderRadius: 14, padding: "14px 18px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
                maxWidth: 340, fontFamily: "Inter, system-ui, sans-serif",
                animation: "slideInRight 0.25s ease",
            }}
        >
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>✅</span>
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#064e3b" }}>
                    {message || "Operațiune reușită"}
                </p>
            </div>
            <button
                onClick={() => { setVisible(false); close(); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}
            >
                ✕
            </button>
            <style>{`
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>,
        document.body
    );
}
