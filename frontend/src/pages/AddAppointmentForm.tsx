import { useContext, useEffect, useState } from "react";
import { addAppointment, findPetByOwnerAndName, getAllClinics, getClinicById, getSlots } from "../api/api.ts";
import { AuthContext } from "../api/authContext.ts";
import ModalShell, { ErrorMsg, Field, PrimaryBtn, SecondaryBtn, VetSelect } from "../components/ModalShell.tsx";

export default function AddAppointmentForm(props) {
    const auth = useContext(AuthContext);
    const [error, setError] = useState<string | null>(null);
    const [clinics, setClinics] = useState([]);
    const [vets, setVets] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [selectedVet, setSelectedVet] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState<string>("");
    const [selectedPet, setSelectedPet] = useState(null);
    const [pets, setPets] = useState([]);

    async function loadVetsByClinic(clinicId) {
        const clinic = await getClinicById(clinicId);
        setVets(clinic.vets ?? []);
        if (clinic.vets?.length > 0) {
            setSelectedVet(clinic.vets[0].id);
            await loadSlotsByVetAndClinic(clinic.vets[0].username, clinicId);
        }
    }

    async function loadSlotsByVetAndClinic(vetUsername: string, clinicId) {
        const options = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false } as const;
        const date = new Intl.DateTimeFormat("en-GB", options).format(new Date()).replaceAll("/", ".").replace(", ", " ");
        let available = await getSlots(auth.token, vetUsername, false, date, null, false);
        available = available.filter((s) => s.status.includes("AVAILABLE") && s.clinic.id == clinicId);
        setSlots(available);
        setSelectedSlot(available[0]?.id?.toString() ?? "");
    }

    async function loadSlotsByVet(vetId, clinicId) {
        const vet = vets.find((v) => v.id == vetId);
        if (!vet) return;
        await loadSlotsByVetAndClinic(vet.username, clinicId);
    }

    useEffect(() => {
        const init = async () => {
            const [allClinics, allPets] = await Promise.all([
                getAllClinics(null, null),
                findPetByOwnerAndName(auth.token, auth.user.username),
            ]);
            setClinics(allClinics);
            setPets(allPets);
            if (allPets.length > 0) setSelectedPet(allPets[0].id);
            if (allClinics.length > 0) {
                setSelectedClinic(allClinics[0].id);
                await loadVetsByClinic(allClinics[0].id);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (selectedVet && selectedClinic) loadSlotsByVet(selectedVet, selectedClinic);
    }, [props.reload, props.appointments]);

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const res = await addAppointment(auth.token, parseInt(selectedSlot), selectedPet);
            sessionStorage.setItem("sendEmailAppointmentId", res.id.toString());
            setError(null);
            props.showToast?.();
            props.save();
        } catch (err) {
            sessionStorage.removeItem("sendEmailAppointmentId");
            setError(err.message);
        }
    }

    const close = () => { props.close(); setError(null); };

    return (
        <ModalShell
            open={props.open}
            onClose={close}
            title="Adaugă o programare"
            footer={<>
                <SecondaryBtn onClick={close}>Închide</SecondaryBtn>
                <PrimaryBtn type="submit" form="add-appointment-form">Salvare</PrimaryBtn>
            </>}
        >
            <form id="add-appointment-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <ErrorMsg error={error} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Clinică" htmlFor="clinic">
                        <VetSelect id="clinic" name="clinic" value={selectedClinic ?? ""}
                            onChange={e => { setSelectedClinic(e.target.value); loadVetsByClinic(e.target.value); }} required>
                            {clinics.length > 0
                                ? clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                : <option disabled>Nu s-au găsit clinici</option>}
                        </VetSelect>
                    </Field>

                    <Field label="Medic" htmlFor="vet">
                        <VetSelect id="vet" name="vet" value={selectedVet ?? ""}
                            onChange={e => { setSelectedVet(e.target.value); loadSlotsByVet(e.target.value, selectedClinic); }} required>
                            {vets.length > 0
                                ? vets.map(v => <option key={v.id} value={v.id}>{v.firstName} {v.lastName} ({v.username})</option>)
                                : <option disabled>Nu s-au găsit medici</option>}
                        </VetSelect>
                    </Field>

                    <Field label="Slot disponibil" htmlFor="slot">
                        <VetSelect id="slot" name="slot" value={selectedSlot}
                            onChange={e => setSelectedSlot(e.target.value)} required>
                            {slots.length > 0
                                ? slots.map(s => <option key={s.id} value={s.id}>{s.slot}</option>)
                                : <option disabled>Nu s-au găsit locuri disponibile</option>}
                        </VetSelect>
                    </Field>

                    <Field label="Animal de companie" htmlFor="pet">
                        <VetSelect id="pet" name="pet" value={selectedPet ?? ""}
                            onChange={e => setSelectedPet(e.target.value)} required>
                            {pets.length > 0
                                ? pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                                : <option disabled>Nu s-au găsit animale</option>}
                        </VetSelect>
                    </Field>
                </div>
            </form>
        </ModalShell>
    );
}
