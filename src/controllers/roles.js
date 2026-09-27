import { 
    getAllRoles as findAllRoles,
    getRoleById as findRoleById,
    getRoleByName as findRoleByName
} from "../models/roles.js";

export async function getAllRoles(req, res) {
    try {
        const roles = await findAllRoles();
        return res.status(200).json(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        return res.status(500).json({ error: "Failed to fetch roles" });
    }
}

// GET one role by id
export async function getRoleById(req, res) {
    try {
        const { id } = req.params;
        const role = await findRoleById(id);

        if (!role) {
            return res.status(404).json({ error: "Role not found" });
        }

        return res.status(200).json(role);
    } catch (error) {
        console.error("Error fetching role:", error);
        return res.status(500).json({ error: "Failed to fetch role" });
    }
}

// GET one role by name
export async function getRoleByName(req, res) {
    try {
        const { name } = req.params;
        const role = await findRoleByName(name);
        if (!role) {
            return res.status(404).json({ error: `Role ${name} not found` });
        }
        return res.status(200).json(role);
    } catch (error) {
        console.error("Error fetching role by name:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}