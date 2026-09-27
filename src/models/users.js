import { User } from "./schemas/users.js";
import { Role } from "./schemas/roles.js";
import bcrypt from "bcrypt";

export async function getAllUsers() {
    return User.find({}).select("-passwordHash").populate("role").lean();
}

export async function getUserById(_id) {
    return User.findOne({ _id })
        .select("-passwordHash")
        .populate("role")
        .lean();
}

export const getUserByEmail = async (email) => {
    return User.findOne({ email }).populate("role");
};

export async function updateUserById(_id, userData) {
    return User.findByIdAndUpdate(_id, userData, {
        returnDocument: "after",
        runValidators: true,
    })
        .select("-passwordHash")
        .populate("role")
        .lean();
}

export async function deleteUserById(_id) {
    return User.findByIdAndDelete(_id);
}

export const createUser = async (name, email, password) => {
    const customer = await Role.findOne({ name: "customer" });
    if (!customer) throw new Error("Default role not found");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
        name,
        email,
        passwordHash,
        role: customer._id,
    });

    return user._id.toString();
};
