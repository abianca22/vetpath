import { Routes, Route } from "react-router-dom";
import Profile from "./pages/Profile";
import RoleTestPage from "./pages/RoleTestPage.tsx";
import RequestsPage from "./pages/RequestsPage.tsx";
import AcceptRequestPage from "./pages/AcceptRequestPage.tsx";
import UsersList from "./pages/UsersListPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import PrivateRoute from "./custom-routes/PrivateRoute.tsx";
import {petOwner, admin, veterinarian} from "./api/roles.ts";
import roles from "./api/roles.ts";
import NotAuthenticatedRoute from "./custom-routes/NotAuthenticatedRoute.tsx";
import {useContext} from "react";
import {AuthContext} from "./api/authContext.ts";
import Menu from "./components/Menu.tsx";
import Visit from "./pages/VisitPage.tsx";
import AccessDenied from "./pages/AccessDeniedPage.tsx";
import PersonalPets from "./pages/PersonalPetsPage.tsx";
import PetTypes from "./pages/PetTypesPage.tsx";
import Breeds from "./pages/BreedsPage.tsx";
import IndividualPet from "./pages/IndividualPetPage.tsx";
import Clinics from "./pages/ClinicsPage.tsx";
import IndividualClinic from "./pages/IndividualClinicPage.tsx";
import SlotsList from "./pages/SlotsListPage.tsx";
import AppointmentsList from "./pages/AppointmentsListPage.tsx";
import AppointmentDetails from "./pages/AppointmentDetailsPage.tsx";
import RecordDetails from "./pages/RecordDetailsPage.tsx";
import RecordsList from "./pages/MedicalRecordsListPage.tsx";
import Chat from "./pages/SymptomsChatPage.tsx";
import ChatEntries from "./pages/ChatEntriesPage.tsx";
import QuestionResponse from "./pages/QuestionResponsePage.tsx";
import Pets from "./pages/PetsPage.tsx";

function App() {
    const auth = useContext(AuthContext);
    return (
        <>
            <div className="d-flex min-vh-100 flex-column">
                    <Menu auth={auth}/>
                    <Routes>
                        <Route path="/" element={<PrivateRoute element={Profile} roles={roles}/>} />
                        <Route path="/profile" element={<PrivateRoute element={Profile} roles={roles}/>} />
                        <Route path="/role-test" element={<PrivateRoute element={RoleTestPage} roles={[petOwner, veterinarian]} />} />
                        <Route path="/admin" element={<PrivateRoute element={AcceptRequestPage} roles={[admin]} />} />
                        <Route path="/requests-list" element={<PrivateRoute element={RequestsPage} roles={[admin]} />} />
                        <Route path="/unauthorized" element={<h1>Unauthorized</h1>} />
                        <Route path="/login" element={<NotAuthenticatedRoute element={LoginPage} />} />
                        <Route path="/users" element={<PrivateRoute element={UsersList} roles={roles} />} />
                        <Route path="/user/:username" element={<PrivateRoute element={Visit} roles={roles}/>} />
                        <Route path="/access-denied" element={<AccessDenied/>} />
                        <Route path="/pets/:username" element={<PrivateRoute element={PersonalPets} roles={roles}/>} />
                        <Route path="/pets/:username/:petName" element={<PrivateRoute element={IndividualPet} roles={roles}/>} />
                        <Route path="/pets/types" element={<PetTypes/>}/>
                        <Route path="/pets/breeds" element={<Breeds/>}/>
                        <Route path="/pets/types/:typeName/breeds" element={<Breeds/>}/>
                        <Route path="/pets" element={<PrivateRoute element={Pets} roles={[admin, veterinarian]}/>}></Route>
                        <Route path="/clinics" element={<Clinics/>}/>
                        <Route path="/clinics/:id" element={<IndividualClinic/>}/>
                        <Route path="/slots/:username" element={<PrivateRoute element={SlotsList} roles={[veterinarian]}/>} />
                        <Route path="/slots" element={<PrivateRoute element={SlotsList} roles={[veterinarian]}/>} />
                        <Route path="/appointments" element={<PrivateRoute element={AppointmentsList} roles={roles}/>} />
                        <Route path="/appointments/details" element={<PrivateRoute element={AppointmentDetails} roles={roles}/>}/>
                        <Route path="/records/details" element={<PrivateRoute element={RecordDetails} roles={roles}/>}/>
                        <Route path="/records" element={<PrivateRoute element={RecordsList} roles={roles}/>} />
                        <Route path="/ask" element={<PrivateRoute element={Chat} roles={roles}/>} />
                        <Route path="/ask/history/:username" element={<PrivateRoute element={ChatEntries} roles={roles}/>} />
                        <Route path="/ask/history/:username/details" element={<PrivateRoute element={QuestionResponse} roles={roles}/>} />

                    </Routes>
            </div>
        </>
    );
}

export default App;
