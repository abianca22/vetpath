export interface UserDTO {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: RoleDTO[];
    pendingRequest: boolean;
    phoneNumber: string;
    profileUrl?: string | null;
}

export interface RoleDTO {
    name: string;
}

export interface TypeDTO {
    id: number;
    name: string;
}

export interface BreedDTO {
    id: number;
    name: string;
    petType: TypeDTO;
}

export interface PetDTO {
    id: number;
    name: string;
    birthDate: string;
    breed: BreedDTO;
    owner: UserDTO;
    weight: number;
    photoUrl: string | null;
    gender: string;
}

export interface ClinicDTO {
    id: number;
    name: string;
    address: string;
    phoneNumber: string;
    vets?: UserDTO[];
}

export interface AppointmentDTO {
    id: number;
    vet: UserDTO;
    pet: PetDTO;
    clinic: ClinicDTO;
    slot: string;
    cancelReason: string | null;
    cancelledBy: UserDTO;
    status: string;
    done: boolean;
    notes: string;
    currentOwner: UserDTO;
}

export interface SlotDTO {
    appointment: AppointmentDTO;
    slotsCount: number;
}

export interface MedicalRecordDTO {
    id: number;
    vet: UserDTO;
    pet: PetDTO;
    diagnosis: string;
    symptoms: string;
    treatment: string;
    recordDate: string;
}

export interface ChatEntryDTO {
    id: number;
    userMessage: string;
    botResponse: string;
    symptoms: string;
    approvedBy: UserDTO;
    pet: PetDTO;
    timestamp: string;
    medicalRecord: MedicalRecordDTO;
}

export interface NotificationDTO {
    id: number;
    receiver: UserDTO;
    appointment: AppointmentDTO;
    title: string;
    content: string;
    seen: boolean;
    date: string;
}