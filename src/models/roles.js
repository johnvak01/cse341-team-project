import Role from "./schemas/roles.js";

export async function getAllRoles() {
    return Role.find({}).lean();
}

export async function getRoleById (_id) {
    return Role.findOne({_id}).lean();
}

