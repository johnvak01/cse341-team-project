import Role from "./schemas/roles.js";

export async function getAllRoles() {
    return Role.find({}).lean();
}

export async function getRoleById(_id) {
    return Role.findOne({ _id }).lean();
}

export const createRole = async (name) => {
    const customer = await Role.findOne({ name: 'name' });
    if (customer) throw new Error('Role Already Exists');

    const newRole = await Role.create({ name });

    return newRole.name.toString();
};


