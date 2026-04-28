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
    photoUrl: string | null;
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
}

export interface SlotDTO {
    appointment: AppointmentDTO;
    slotsCount: number;
}