const petOwner = {
    name: "PET_OWNER"
}

const admin = {
    name: "ADMIN"
}

const veterinarian = {
    name: "VETERINARIAN"
}

export default [petOwner, admin, veterinarian];
export { petOwner, admin, veterinarian };

export function isAdmin(roles) {
    return roles.some(role => role.name === admin.name);
}

export function isPetOwner(roles) {
    return roles.some(role => role.name === petOwner.name);
}

export function isVeterinarian(roles) {
    return roles.some(role => role.name === veterinarian.name);
}
