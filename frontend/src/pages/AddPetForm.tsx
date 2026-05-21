import {useContext, useEffect, useState} from "react";
import {Button, Form, FormSelect, Modal, Row, Col} from "react-bootstrap";
import {addPet, editPet, getAllBreeds, getAllTypes, getBreedsByType} from "../api/api.ts";
import {DatePicker} from "rsuite";
import {format} from "date-fns";
import {AuthContext} from "../api/authContext.ts";

export default function AddPetForm(props) {
    const auth = useContext(AuthContext);
    const [error, setError] = useState(null);
    const [types, setTypes] = useState(null);
    const [breeds, setBreeds] = useState(null);
    const [dob, setDob] = useState(null);

    async function fetchBreedsByType(typeId) {
        try {
            const res = await getBreedsByType(typeId);
            setBreeds(res);
            setError(null);
        } catch (err) {
            setError(err.message);
            setBreeds([]);
        }
    }

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const res = await getAllTypes();
                setTypes(res);
                setError(null);
                await fetchBreedsByType(res[0].id);
            }
            catch (err) {
                setError(err.message);
            }
        }
        fetchTypes();
        const fetchBreeds = async () => {
            try {
                const res = await getAllBreeds();
                setBreeds(res);
                setError(null);
            } catch (err) {
                setError(err.message);
            }
        }
        fetchBreeds();

        const fetchBD = async () => {
            if (props.pet && props.pet.birthDate) {
                setDob(new Date(props.pet.birthDate.split('.')[2], props.pet.birthDate.split('.')[1] - 1, props.pet.birthDate.split('.')[0]));
            }
        }
        fetchBD();
    }, [props.pet]);


    async function postData(formData) {
        const name = formData.get("name");
        const breedId = parseInt(formData.get("breed"));
        const petDob = dob ? format(dob, 'dd.MM.yyyy') : null;
        const petDobArr = petDob ? petDob.split('.').map(num => parseInt(num)) : null;
        const date = petDobArr ? new Date(petDobArr[2], petDobArr[1] - 1, petDobArr[0]) : null;
        const genderValue = (formData.get("gender") as string);
        const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null;
        if (date === null || isNaN(date.getTime())) {
            setError("Data nașterii nu este validă. Asigurați-vă că ați selectat o dată. Dacă nu cunoașteți data exactă, alegeți una aproximativă.");
            return;
        }
        if (date > new Date()) {
            setError("Data nașterii nu poate fi în viitor.");
            return;
        }
        if (props.pet) {
            const savePet = async () => {
                try {
                    await editPet(auth.token, {id: props.pet.id, name: name, breed: {id: breedId}, birthDate: petDob, gender: genderValue.toUpperCase(), weight: weight});
                    setError(null);
                    props.save();
                }
                catch (err) {
                    setError(err.message);
                }
            }
            savePet();
        }
        else {
            const savePet = async () => {
                try {
                    await addPet(auth.token, {name: name, breed: {id: breedId}, birthDate: petDob, gender: genderValue.toUpperCase(), weight: weight});
                    setError(null);
                    props.save();
                } catch (err) {
                    setError(err.message);
                }
            }
            savePet();
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        postData(fd);
    }

    return <>
        <Modal show={props.open} onHide={() => {props.close(); setError(null)}} centered>
            <Modal.Header closeButton className="border-bottom pb-3">
                <Modal.Title className="fw-semibold">Adaugă animal de companie</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 py-3">
                {error && error.split('\n').map(err => <p key={err.split(' ')[0]} className="text-danger mb-1"><small>{err}</small>
                    </p>)}
                <Form id="add-pet-form" onSubmit={handleSubmit}>
                    <Row className="g-3">
                        <Col xs={12} md={6}>
                            <Form.Group controlId="pet-name">
                                <Form.Label className="fw-medium mb-1">Nume</Form.Label>
                                {
                                    props.pet ? <Form.Control defaultValue={props.pet.name} name="name" type="text" />
                                        :
                                        <Form.Control placeholder="ex: Max" name="name" type="text" />
                                }
                            </Form.Group>
                        </Col>

                        <Col xs={12} md={6}>
                            <Form.Group controlId="pet-type">
                                <Form.Label className="fw-medium mb-1">Tip animal</Form.Label>
                                <FormSelect name="type" defaultValue={props.pet ? props.pet?.breed?.type?.id : ((types && types.length > 0) ? types[0].id: '')} onChange={(e) => {
                                    const selectedTypeId = e.target.value;
                                    e.persist();
                                    fetchBreedsByType(selectedTypeId);
                                }} aria-label="Tip animal">
                                    {types && types.length > 0 ? types.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    )) : <option disabled>Nu s-au găsit tipuri</option>}
                                </FormSelect>
                            </Form.Group>
                        </Col>

                        <Col xs={12} md={6}>
                            <Form.Group controlId="pet-breed">
                                <Form.Label className="fw-medium mb-1">Rasă</Form.Label>
                                <FormSelect name="breed" defaultValue={props.pet ? props.pet?.breed?.id : ((breeds && breeds.length > 0) ? breeds[0].id: '')} aria-label="Rasa">
                                    {breeds && breeds.length > 0 ? breeds.map(breed => (
                                        <option key={breed.id} value={breed.id}>{breed.name}</option>
                                    )) : <option disabled>Nu s-au găsit rase</option>}
                                </FormSelect>
                            </Form.Group>
                        </Col>

                        <Col xs={12} md={6}>
                            <Form.Group controlId="pet-gender">
                                <Form.Label className="fw-medium mb-1">Gen</Form.Label>
                                <FormSelect name="gender" defaultValue={props.pet ? props.pet?.gender : 'none'} aria-label="Gender">
                                    <option value="male">Mascul</option>
                                    <option value="female">Femela</option>
                                    <option value="none">Nu se mentioneaza</option>
                                </FormSelect>
                            </Form.Group>
                        </Col>

                        <Col xs={12} md={6}>
                            <Form.Group controlId="pet-dob">
                                <Form.Label className="fw-medium mb-1">Data nașterii</Form.Label>
                                <div>
                                    <DatePicker
                                        format="dd.MM.yyyy"
                                        value={dob}
                                        onChange={setDob}
                                        style={{width: '100%'}}
                                        container={() => document.body}
                                        oneTap={false}
                                    />
                                </div>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group controlId="pet-weight">
                                <Form.Label className="fw-medium mb-1">Greutate</Form.Label>
                                {
                                    props.pet ? <Form.Control defaultValue={props.pet.weight} name="name" type="text" />
                                        :
                                        <Form.Control name="weight" type="text" step={0.01} min={0}/>
                                }
                            </Form.Group>
                        </Col>

                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-top pt-3">
                <Button variant="secondary" onClick={() => {props.close(); setError(null)}}>Închide</Button>
                <Button type="submit" variant="primary" form="add-pet-form">Salvare</Button>
            </Modal.Footer>
        </Modal>
    </>
}