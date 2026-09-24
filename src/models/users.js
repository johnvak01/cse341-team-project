import {User} from "./schemas/users.js";
import {Role} from "./schemas/roles.js";
import bcrypt from "bcrypt";

export async function getAllUsers() {
    return User.find({}).lean();
}

export async function getUserById(_id) {
    return User.findOne({ _id }).lean();
}

export const createUser = async (name, email, password) => {
  const customer = await Role.findOne({ name: 'customer' });
  if (!customer) throw new Error('Default role not found');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: customer._id
  });

  return user._id.toString();
};

export const findUserByEmail = async (email) => {
  return User.findOne({ email }).populate('role');
};

export const verifyPassword = async (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};