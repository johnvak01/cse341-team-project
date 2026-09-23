import User from "./schemas/users.js";

export async function getAllUsers() {
    return User.find({}).lean();
}

export async function getUserById(_id) {
    return User.findOne({ _id }).lean();
}