import { useContext, useState } from "react";
import { AuthContext } from "../api/authContext.ts";
import { cancelAppointment } from "../api/api.ts";
import ModalShell, { ErrorMsg, Field, SecondaryBtn, VetInput } from "./ModalShell.tsx";

export default function CancelAppointmentForm(props) {
    const auth = useContext(AuthContext);
    const [error, setError] = useState<string | null>(null);
    const [recreate, setRecreate] = useState(true);

    const isVetOwner = props.slot && props.slot.vet?.id === auth.user?.id;

    async function handleSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const cancelReason = fd.get("reason") as string;
        if (!props.slot) return;
        try {
            const res = await cancelAppointment(auth.token, auth.user, props.slot.id, isVetOwner ? recreate : true, cancelReason);
            setError(null);
            sessionStorage.setItem("sendEmailAppointmentId", res.id.toString());
            props.showToast?.();
            props.save();
        } catch (err) {
            sessionStorage.removeItem("sendEmailAppointmentId");
            setError(String(err));
        }
    }

    const close = () => { props.close(); setError(null); };

    return (
        <ModalShell
            open={props.open}
            onClose={close}
            title="Anulare programare"
            maxWidth={460}
            footer={<>
                <SecondaryBtn onClick={close}>Renunțare</SecondaryBtn>
                <button type="submit" form="cancel-appointment-form"
                    style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#b91c1c")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#dc2626")}>
                    Anulează programarea
                </button>
            </>}
        >
            <form id="cancel-appointment-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <ErrorMsg error={error} />

                <Field label="Motivul anulării" htmlFor="reason">
                    <VetInput id="reason" name="reason" type="text" placeholder="ex: Nu mai pot ajunge..." />
                </Field>

                {isVetOwner && (
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "#374151", userSelect: "none" }}>
                        <div
                            onClick={() => setRecreate(r => !r)}
                            style={{
                                width: 40, height: 22, borderRadius: 11, background: recreate ? "#1d9e75" : "#cbd5e1",
                                position: "relative", transition: "background .2s", flexShrink: 0, cursor: "pointer",
                            }}
                        >
                            <div style={{
                                position: "absolute", top: 3, left: recreate ? 21 : 3,
                                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                                transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            }} />
                        </div>
                        {recreate ? "Doresc eliberarea intervalului" : "Doresc eliminarea intervalului"}
                    </label>
                )}
            </form>
        </ModalShell>
    );
}
