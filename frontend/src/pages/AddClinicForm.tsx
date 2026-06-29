import { useContext, useState } from "react";
import { addClinic } from "../api/api.ts";
import { AuthContext } from "../api/authContext.ts";
import ModalShell, { ErrorMsg, Field, PrimaryBtn, SecondaryBtn, VetInput } from "../components/ModalShell.tsx";

export default function AddClinicForm(props) {
    const auth = useContext(AuthContext);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
            await addClinic(auth.token, {
                name: fd.get("name") as string,
                address: fd.get("address") as string,
                phoneNumber: fd.get("phone") as string,
            });
            setError(null);
            props.save();
            props.showToast?.();
        } catch (err) {
            setError(err.message);
        }
    }

    const close = () => { props.close(); setError(null); };

    return (
        <ModalShell
            open={props.open}
            onClose={close}
            title="Adaugă o clinică"
            footer={<>
                <SecondaryBtn onClick={close}>Închide</SecondaryBtn>
                <PrimaryBtn type="submit" form="add-clinic-form">Salvare</PrimaryBtn>
            </>}
        >
            <form id="add-clinic-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <ErrorMsg error={error} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Denumire" htmlFor="clinic-name">
                        <VetInput id="clinic-name" name="name" type="text" placeholder="ex: VetCare Clinic" required />
                    </Field>
                    <Field label="Adresă" htmlFor="clinic-address">
                        <VetInput id="clinic-address" name="address" type="text" placeholder="ex: Str. Florilor 12" required />
                    </Field>
                </div>
                <div style={{ maxWidth: "50%", paddingRight: 8 }}>
                    <Field label="Telefon" htmlFor="clinic-phone">
                        <VetInput id="clinic-phone" name="phone" type="text" placeholder="ex: 0712345678" required />
                    </Field>
                </div>
            </form>
        </ModalShell>
    );
}
