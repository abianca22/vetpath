// api.ts — helper to send Keycloak user info to backend
// Minimal wrapper: sends userinfo with Authorization: Bearer <token>

// export default async function postUserInfo(token: string, userinfo: Record<string, unknown>) {
//   const base = import.meta.env.VITE_API_URL ?? '';
//   const url = base ? `${base.replace(/\/$/, '')}/api/userdata` : '/api/userdata';
//
//   const res = await fetch(url, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`,
//     },
//     body: JSON.stringify(userinfo),
//     credentials: 'include',
//   });
//
//   if (!res.ok) {
//     const text = await res.text().catch(() => '');
//     console.error('postUserInfo failed', res.status, res.statusText, text);
//     throw new Error(`Failed to post user info: ${res.status}`);
//   }
//
//   return res.json().catch(() => null);
// }

import type {
    AppointmentDTO,
    BreedDTO,
    ChatEntryDTO,
    ClinicDTO,
    MedicalRecordDTO,
    PetDTO,
    TypeDTO,
    UserDTO
} from "../types.ts";

export const getUserInfo = async (token): Promise<UserDTO> => {
  const res = await fetch("http://localhost:8081/api/users/users/me", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('getUserInfo failed', res.status, res.statusText, text);
    throw new Error(`Failed to get user info: ${res.status}`);
  }

  return await res.json();
};

export const updateData = async (token, data): Promise<UserDTO> => {
    console.log("Updating user data with token:", token);
    console.log("Data being sent:", data);
  const res = await fetch("http://localhost:8081/api/users/update-personal-info", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return await res.json();
}

export const deleteUser = async (token, auth): Promise<void> => {
  await fetch(`http://localhost:8081/api/admin/users/${auth.user.id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export const getAllUsers = async (token): Promise<UserDTO[]> => {
    const res = await fetch("http://localhost:8081/api/users/all", {
        headers: { Authorization: `Bearer ${token}` }
    });

    return await res.json();
}

export const getAllVeterinarians = async (token): Promise<Array<UserDTO>> => {
    const res = await fetch("http://localhost:8081/api/users/admin-vet", {
        headers: { Authorization: `Bearer ${token}` }
    });

    return await res.json();
}

export const changeRole = async (token, id, role): Promise<UserDTO> => {
    const res = await fetch(`http://localhost:8081/api/admin/users/${id}/change-user-role?role=${role}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    return await res.json();
}

export const findUserByUsername = async (token, username): Promise<UserDTO> => {
    const res = await fetch(`http://localhost:8081/api/users/user/${username}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    });
    const userRes = await res;
    if (userRes.status === 403) {
        throw new Error("Forbidden");
    }
    return userRes.json();
}

export const findPetByOwnerAndName = async (token, username, petName = null): Promise<Array<PetDTO>> => {
    let res;
    if (petName === null || petName === '' || petName === undefined) {
        res = await fetch(`http://localhost:8081/api/pets/user/${username}`, {
            method: "GET",
            headers: {Authorization: `Bearer ${token}`}
        });
    }
    else {
        res = await fetch(`http://localhost:8081/api/pets/user/${username}?search=${petName}`, {
            method: "GET",
            headers: {Authorization: `Bearer ${token}`}
        });
    }
    const petRes = await res;
    return petRes.json();
}

export const getAllTypes = async(): Promise<Array<TypeDTO>> => {
    const res = await fetch(`http://localhost:8081/api/pets/types`, {
        method: "GET"
    });
    return await res.json();
}

export const getAllBreeds = async(): Promise<Array<BreedDTO>> => {
    const res = await fetch(`http://localhost:8081/api/pets/breeds`, {
        method: "GET"
    });
    return await res.json();
}

export const getBreedsByType = async(typeId): Promise<Array<BreedDTO>> => {
    const res = await fetch(`http://localhost:8081/api/pets/types/${typeId}/breeds`, {
        method: "GET"
    });
    if (!res.ok) {
        throw new Error(`Failed to get breeds for type ${typeId}: ${await res.text()}`);
    }
    return await res.json();
}

export const addPetType = async(token, typeName): Promise<TypeDTO> => {
    const res = await fetch(`http://localhost:8081/api/pets/add-pet-type`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name: typeName})
    });
    const typeRes = await res;
    if (!typeRes.ok) {
        throw new Error(`Failed to add pet type: ${typeRes.status}`);
    }
    return await res.json();
}

export const deletePetType = async(token, typeId): Promise<void> => {
    const res = await fetch(`http://localhost:8081/api/pets/types/${typeId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to delete pet type: ${res.status}`);
    }
}

export const addBreed = async(token, breedName, typeId): Promise<BreedDTO> => {
    const res = await fetch(`http://localhost:8081/api/pets/add-breed`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name: breedName, petType: {id: typeId}})
    });
    const breedRes = await res;
    if (!breedRes.ok) {
        throw new Error(`Failed to add breed: ${breedRes.status}`);
    }
    return await res.json();
}

export const deleteBreed = async(token, breedId): Promise<void> => {
    const res = await fetch(`http://localhost:8081/api/pets/breeds/${breedId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to delete breed: ${res.status}`);
    }
}

export const getPetById = async(token, petId, userId): Promise<PetDTO> => {
    const res = await fetch(`http://localhost:8081/api/user/${userId}/${petId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
        });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    return await res.json();
}

export const addPet = async(token, petData): Promise<PetDTO> => {
    console.log(token);
    console.log(petData);
    const res = await fetch(`http://localhost:8081/api/pets/add-pet`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(petData)
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    return await res.json();
}

export const editPet = async(token, petData): Promise<PetDTO> => {
    const res = await fetch(`http://localhost:8081/api/pets/${petData.id}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(petData)
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    return await res.json();
}

export const deletePet = async(token, petId): Promise<void> => {
    const res = await fetch(`http://localhost:8081/api/pets/${petId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to delete pet: ${res.status}`);
    }
}

export const getClinicsByVeterinarian = async(vet): Promise<Array<ClinicDTO>> => {
    const res = await fetch(`http://localhost:8081/api/clinics/veterinarian/${vet}`, {
        method: "GET"
    });

    if (!res.ok) {
        throw new Error(`Failed to get clinics for veterinarian ${vet}: ${res.status}`);
    }
    return await res.json();
}

export const getAllClinics = async(): Promise<Array<ClinicDTO>> => {
    const res = await fetch(`http://localhost:8081/api/clinics/all`, {
        method: "GET"
    });

    if (!res.ok) {
        throw new Error(`Failed to get clinics: ${res.status}`);
    }
    return await res.json();
}

export const getClinicById = async(clinicId): Promise<ClinicDTO> => {
    const res = await fetch(`http://localhost:8081/api/clinics/${clinicId}`, {
        method: "GET"
    });

    if (!res.ok) {
        throw new Error(`Failed to get clinic with id ${clinicId}: ${res.status}`);
    }
    return await res.json();
}

export const editClinic = async(token, clinic): Promise<ClinicDTO> => {
    console.log(clinic);
    const res = await fetch(`http://localhost:8081/api/clinics/update/${clinic.id}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(clinic)
    });

    if (!res.ok) {
        throw new Error(`Unable to update the clinic with id ${clinic.id}`);
    }

    return await res.json();
}

export const addClinic = async(token, clinic): Promise<ClinicDTO> => {
    const res = await fetch(`http://localhost:8081/api/clinics`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(clinic)
    });

    if (!res.ok) {
        throw new Error(`Unable to create clinic with name ${clinic.name} and address ${clinic.address}`);
    }

    return await res.json();
}

export const deleteClinic = async(token, clinicId): Promise<void> => {
    const res = await fetch(`http://localhost:8081/api/clinics/${clinicId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to delete clinic: ${res.status}`);
    }
}

export const joinClinic = async(token, username, clinicId): Promise<ClinicDTO> => {
    const res = await fetch(`http://localhost:8081/api/clinics/${clinicId}?username=${username}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to join clinic: ${res.status}`);
    }

    return await res.json();
}

export const leaveClinic = async(token, username, clinicId): Promise<ClinicDTO> => {
    const res = await fetch(`http://localhost:8081/api/clinics/${clinicId}?username=${username}&add=false`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to leave clinic: ${res.status}`);
    }

    return await res.json();
}

export const getSlots = async(token, username, allSlots = true, start = null, end = null): Promise<Array<AppointmentDTO>> => {
    const res = await fetch(`http://localhost:8081/api/appointments/${username}?allSlots=${allSlots}${
        start && end ? `&startDate=${start}&endDate=${end}` : (start ? `&startDate=${start}` : (end ? `&endDate=${end}` : ''))
    }`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
    });

    if (!res.ok) {
        throw new Error(`Failed to get appointments for user ${username}: ${res.status}`);
    }

    return await res.json();
}

export const getAppointments = async(token): Promise<Array<AppointmentDTO>> => {
    const res = await fetch(`http://localhost:8081/api/appointments`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to get appointments: ${res.status}`);
    }

    return await res.json();
}

export const addSlots = async(token, user, clinicId, date, slotsCount): Promise<Array<AppointmentDTO>> => {
    const body = {
        appointment: {
            vet: {
                id: user.id
            },
            clinic: {
                id: clinicId
            },
            slot: date
        },
        slotsCount: slotsCount
    };
    const res = await fetch('http://localhost:8081/api/appointments', {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        throw new Error(`Failed to get appointments: ${await res.text()}`);
    }

    return await res.json();
}

export const addAppointment = async(token, appointmentId, petId): Promise<AppointmentDTO> => {
    console.log(`Booking appointment with id ${appointmentId} for pet with id ${petId} using token ${token}`);
    const res = await fetch(`http://localhost:8081/api/appointments/${appointmentId}?pet=${petId}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to book appointment: ${await res.text()}`);
    }

    return await res.json();
}


export const deleteSlot = async(token, slotId): Promise<void> => {
    const res = await fetch(`http://localhost:8081/api/appointments/${slotId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }
}

export const cancelAppointment = async (token, user, slotId, recreateSlot = true, cancelReason = null): Promise<AppointmentDTO> => {
    const body = {
        cancelledBy: {
            id: user.id
        },
        cancelReason: cancelReason
    }

    const res = await fetch(`http://localhost:8081/api/appointments/${slotId}/cancel?freeSlot=${recreateSlot}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return await res.json();
}

export const getAppointment = async (token, id): Promise<AppointmentDTO> => {
    const res = await fetch(`http://localhost:8081/api/appointments/appointment/${id}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return await res.json();
}

export const changeAppointmentPet = async(token, id, petId): Promise<AppointmentDTO> => {
    const body = {id: petId};
    const res = await fetch(`http://localhost:8081/api/appointments/${id}/edit`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if(!res.ok) {
        throw new Error(await res.text());
    }

    return await res.json();
}

export const confirmAppointment = async(token, id): Promise<AppointmentDTO> => {
    const res = await fetch(`http://localhost:8081/api/appointments/${id}/confirm`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return await res.json();

}

export const addRecord = async(token, recordData): Promise<MedicalRecordDTO> => {
    const res = await fetch(`http://localhost:8081/api/records`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(recordData)
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return await res.json();
}

export const getRecordByAppointment = async (token, appointmentId): Promise<MedicalRecordDTO | null> => {
    const res = await fetch(`http://localhost:8081/api/records/appointment/${appointmentId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    return await res.json();
}

export const getRecordById = async (token, id): Promise<MedicalRecordDTO | null> => {
    const res = await fetch(`http://localhost:8081/api/records/${id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    return await res.json();
}

export const getRecordsByPet = async(token, petId): Promise<Array<MedicalRecordDTO>> => {
    const res = await fetch(`http://localhost:8081/api/records/pet/${petId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }

    return await res.json();
}

export const getRecordsByVet = async(token, vetId, owner, pet, checked, startDate, endDate): Promise<Array<MedicalRecordDTO>> => {
    const requestParams = []
    if (startDate !== null && startDate !== undefined && startDate.trim() !== '') {
        requestParams.push(`startDate=${startDate}`);
    }
    if (endDate !== null && endDate !== undefined && endDate.trim() !== '') {
        requestParams.push(`endDate=${endDate}`);
    }
    if (owner !== null && owner !== undefined && owner.trim() !== '') {
        requestParams.push(`owner=${owner.trim()}`);
    }
    if (pet !== null && pet !== undefined && pet.trim() !== '') {
        requestParams.push(`pet=${pet.trim()}`);
    }
    if (checked) {
        requestParams.push(`generated=${checked}`);
    }
    const res = await fetch(`http://localhost:8081/api/records/vet/${vetId}${requestParams.length > 0 ? `?${requestParams.join('&')}` : ''}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }

    return await res.json();
}

export const getRecords = async(token, vet, owner, pet, checked, startDate, endDate): Promise<Array<MedicalRecordDTO>> => {
    const requestParams = []
    if (startDate !== null && startDate !== undefined && startDate.trim() !== '') {
        requestParams.push(`startDate=${startDate}`);
    }
    if (endDate !== null && endDate !== undefined && endDate.trim() !== '') {
        requestParams.push(`endDate=${endDate}`);
    }
    if (vet !== null && vet !== undefined && vet.trim() !== '') {
        requestParams.push(`vet=${vet.trim()}`);
    }
    if (owner !== null && owner !== undefined && owner.trim() !== '') {
        requestParams.push(`owner=${owner.trim()}`);
    }
    if (pet !== null && pet !== undefined && pet.trim() !== '') {
        requestParams.push(`pet=${pet.trim()}`);
    }
    if (checked) {
        requestParams.push(`generated=${checked}`);
    }
    const res = await fetch(`http://localhost:8081/api/records/all${requestParams.length > 0 ? `?${requestParams.join('&')}` : ''}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    return await res.json();
}

export const deleteRecord = async(token, recordId): Promise<void> => {
    const res = await fetch(`http://localhost:8081/api/records/${recordId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
}

export const editRecord = async(token, id, recordData): Promise<MedicalRecordDTO> => {
    const res = await fetch(`http://localhost:8081/api/records/${id}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(recordData)
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return await res.json();
}

export const sendQuestion = async(token, question, petId): Promise<string> => {
    const res = await fetch(`http://localhost:8081/chat/ask/${petId}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/plain"
        },
        body: question
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return await res.text();
}

export const fetchChatEntries = async(token, username): Promise<Array<ChatEntryDTO>> => {
    const res = await fetch(`http://localhost:8081/chat/owner/${username}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return await res.json();
}

export const fetchQuestion = async(token, questionId): Promise<ChatEntryDTO> => {
    const res = await fetch(`http://localhost:8081/chat/${questionId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return await res.json();
}

export const deleteQuestion = async(token, questionId): Promise<void> => {
    const res = await fetch(`http://localhost:8081/chat/${questionId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }
}

export const filterPets = async(token, owner, name, type, breed): Promise<Array<PetDTO>> => {
    const requestParams = [];
    if (owner !== null) {
        requestParams.push(`owner=${owner.trim()}`);
    }
    if (name !==  null) {
        requestParams.push(`name=${name.trim()}`);
    }
    if (type !==  null) {
        requestParams.push(`type=${type}`);
    }
    if (breed !==  null) {
        requestParams.push(`breed=${breed}`);
    }
    const res = await fetch(`http://localhost:8081/api/pets${requestParams.length !== 0 ? `?${requestParams.join('&')}` : ''}`,  {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return await res.json();
}


// export const fetchAppointments = async(token, startDate, endDate, petId, vetName, clinicId, status, owner): Promise<Array<AppointmentDTO>> =>{
//     const res = await fetch(`http://localhost:8081/api/appointments${startDate || endDate || petId !== null || vetName !== null || clinicId !== null || status !== null ?  '?' : ''}startDate=${startDate}&endDate=${endDate}&pet=${petId}&vet=${vetName}&clinic=${clinicId}&status=${status === 'BOOKED'}&owner=${owner}`, {
//         method: 'GET',
//         headers: {
//             Authorization: `Bearer ${token}`
//         }
//     });
//
//     if (!res.ok) {
//         throw new Error(await res.text());
//     }
//
//     return await res.json();
// }