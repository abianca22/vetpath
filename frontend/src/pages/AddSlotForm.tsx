import { useContext, useEffect, useState } from "react";
import { addSlots, getClinicsByVeterinarian } from "../api/api.ts";
import { AuthContext } from "../api/authContext.ts";
import { DatePicker } from "rsuite";
import ModalShell, { ErrorMsg, Field, PrimaryBtn, SecondaryBtn, VetInput, VetSelect } from "../components/ModalShell.tsx";

export default function AddSlotForm(props) {
    const auth = useContext(AuthContext);
    const [error, setError] = useState<string | null>(null);
    const [clinics, setClinics] = useState([]);
    const [slot, setSlot] = useState<Date>(new Date());

    useEffect(() => {
        getClinicsByVeterinarian(auth.user.username).then(setClinics).catch(() => {});
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const clinic = fd.get("clinic") as string;
        const slotsCount = fd.get("slotsCount") as string;
        try {
            const options = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false } as const;
            const startSlot = new Intl.DateTimeFormat("en-GB", options).format(slot).replaceAll("/", ".").replace(", ", " ");
            await addSlots(auth.token, auth.user, clinic, startSlot, slotsCount);
            setError(null);
            props.save();
        } catch (err) {
            setError(err.message);
        }
    }

    const close = () => { props.close(); setError(null); };

    return (
        <ModalShell
            open={props.open}
            onClose={close}
            title="Adaugă sloturi"
            footer={<>
                <SecondaryBtn onClick={close}>Închide</SecondaryBtn>
                <PrimaryBtn type="submit" form="add-slots-form">Salvare</PrimaryBtn>
            </>}
        >
            <form id="add-slots-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <ErrorMsg error={error} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Clinică" htmlFor="clinic">
                        <VetSelect id="clinic" name="clinic" defaultValue={clinics[0]?.id ?? ""} required>
                            {clinics.length > 0
                                ? clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                : <option disabled>Nu s-au găsit clinici</option>}
                        </VetSelect>
                    </Field>

                    <Field label="Data start">
                        <DatePicker format="dd.MM.yyyy HH:mm" value={slot} onChange={v => v && setSlot(v)}
                            style={{ width: "100%" }} container={() => document.body} />
                    </Field>

                    <Field label="Număr sloturi (interval 30 min)" htmlFor="slots-count">
                        <VetInput id="slots-count" name="slotsCount" type="number"
                            min={1} max={20} defaultValue={1} required />
                    </Field>
                </div>
            </form>
        </ModalShell>
    );
}
