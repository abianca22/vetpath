import { useContext, useEffect, useState } from "react";
import { addPet, editPet, getAllTypes, getBreedsByType } from "../api/api.ts";
import { DatePicker } from "rsuite";
import { format } from "date-fns";
import { AuthContext } from "../api/authContext.ts";
import ModalShell, { ErrorMsg, Field, PrimaryBtn, SecondaryBtn, VetInput, VetSelect } from "../components/ModalShell.tsx";

const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };

export default function AddPetForm(props) {
    const auth = useContext(AuthContext);
    const [error, setError] = useState<string | null>(null);
    const [types, setTypes] = useState([]);
    const [breeds, setBreeds] = useState([]);
    const [dob, setDob] = useState<Date | null>(null);

    async function fetchBreedsByType(typeId) {
        try {
            const res = await getBreedsByType(typeId);
            setBreeds(res);
        } catch (err) {
            setError(err.message);
            setBreeds([]);
        }
    }

    useEffect(() => {
        const init = async () => {
            try {
                const res = await getAllTypes();
                setTypes(res);
                const initialType = props.pet?.breed?.type?.id ?? res[0]?.id;
                if (initialType) await fetchBreedsByType(initialType);
            } catch (err) {
                setError(err.message);
            }
        };
        init();

        const workOnDate = () => {
            if (props.pet?.birthDate) {
                const parts = props.pet.birthDate.split(".");
                setDob(new Date(parts[2], parts[1] - 1, parts[0]));
            }
        }
        workOnDate();
    }, [props.pet]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = fd.get("name") as string;
        const breedId = parseInt(fd.get("breed") as string);
        const genderValue = fd.get("gender") as string;
        const weight = fd.get("weight") ? parseFloat(fd.get("weight") as string) : null;

        const petDob = dob ? format(dob, "dd.MM.yyyy") : null;
        if (!petDob) { setError("Data nașterii nu este validă. Selectați o dată."); return; }
        const parts = petDob.split(".").map(Number);
        const date = new Date(parts[2], parts[1] - 1, parts[0]);
        if (isNaN(date.getTime())) { setError("Data nașterii nu este validă."); return; }
        if (date > new Date()) { setError("Data nașterii nu poate fi în viitor."); return; }

        try {
            let pet;
            if (props.pet) {
                pet = await editPet(auth.token, { id: props.pet.id, name, breed: { id: breedId }, birthDate: petDob, gender: genderValue.toUpperCase(), weight });
            } else {
                pet = await addPet(auth.token, { name, breed: { id: breedId }, birthDate: petDob, gender: genderValue.toUpperCase(), weight });
            }
            setError(null);
            props.save(pet);
        } catch (err) {
            setError(err.message);
        }
    }

    const close = () => { props.close(); setError(null); };

    return (
        <ModalShell
            open={props.open}
            onClose={close}
            title={props.pet ? "Editează animal de companie" : "Adaugă animal de companie"}
            footer={<>
                <SecondaryBtn onClick={close}>Închide</SecondaryBtn>
                <PrimaryBtn type="submit" form="add-pet-form">Salvare</PrimaryBtn>
            </>}
        >
            <form id="add-pet-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <ErrorMsg error={error} />
                <div style={grid2}>
                    <Field label="Nume" htmlFor="pet-name">
                        <VetInput id="pet-name" name="name" type="text" placeholder="ex: Max"
                            defaultValue={props.pet?.name ?? ""} required />
                    </Field>

                    <Field label="Tip animal" htmlFor="pet-type">
                        <VetSelect id="pet-type" name="type"
                            defaultValue={props.pet?.breed?.type?.id ?? (types[0]?.id ?? "")}
                            onChange={e => fetchBreedsByType(e.target.value)}>
                            {types.length > 0
                                ? types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                                : <option disabled>Nu s-au găsit tipuri</option>}
                        </VetSelect>
                    </Field>

                    <Field label="Rasă" htmlFor="pet-breed">
                        <VetSelect id="pet-breed" name="breed"
                            defaultValue={props.pet?.breed?.id ?? (breeds[0]?.id ?? "")}>
                            {breeds.length > 0
                                ? breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                                : <option disabled>Nu s-au găsit rase</option>}
                        </VetSelect>
                    </Field>

                    <Field label="Gen" htmlFor="pet-gender">
                        <VetSelect id="pet-gender" name="gender" defaultValue={props.pet?.gender?.toLowerCase() ?? "none"}>
                            <option value="male">Mascul</option>
                            <option value="female">Femelă</option>
                            <option value="none">Nu se menționează</option>
                        </VetSelect>
                    </Field>

                    <Field label="Data nașterii">
                        <DatePicker format="dd.MM.yyyy" value={dob} onChange={setDob} placeholder="Selectare dată"
                            style={{ width: "100%" }} container={() => document.body} oneTap />
                    </Field>

                    <Field label="Greutate (kg)" htmlFor="pet-weight">
                        <VetInput id="pet-weight" name="weight" type="number"
                            step={0.01} min={0} placeholder="ex: 4.5"
                            defaultValue={props.pet?.weight ?? ""} />
                    </Field>
                </div>
            </form>
        </ModalShell>
    );
}
