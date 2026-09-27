import {
    createUser,
    deleteUserById,
    getAllUsers as findAllUsers,
    getUserById as findUserById,
    getUserByEmail,
    updateUserById as updateStoredUser,
} from "../models/users.js";
import { deleteBookingsByUserId } from "../models/bookings.js";
import { getRoleByName } from "../models/roles.js";
import { hasRole } from "../middleware/authentication.js";

export async function getUsers(req, res) {
    try {
        const users = await findAllUsers();
        return res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Failed to fetch users" });
    }
}

export async function getUserById(req, res) {
    try {
        const user = await findUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        console.error("Error fetching user:", error);
        return res.status(500).json({ error: "Failed to fetch user" });
    }
}

export async function accountPage(req, res) {
    res.render("users", {
        title: "Your Account",
        usersEndpoint: `/api/users/${req.user._id}`,
        isAdmin: res.locals.isAdmin,
    });
}

export async function updateUser(req, res) {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email =
        typeof req.body?.email === "string" ? req.body.email.trim() : "";
    if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
    }

    try {
        const userData = { name, email };
        if (req.body?.role !== undefined) {
            if (!hasRole(req.user, "admin")) {
                return res
                    .status(403)
                    .json({ error: "Only admins can change user roles" });
            }
            if (!["admin", "customer"].includes(req.body.role)) {
                return res.status(400).json({ error: "Invalid user role" });
            }

            const role = await getRoleByName(req.body.role);
            if (!role) {
                return res.status(400).json({ error: "Invalid user role" });
            }
            userData.role = role._id;
        }

        const user = await updateStoredUser(req.params.id, userData);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (String(req.user._id) === req.params.id) {
            req.session.user.name = user.name;
            req.session.user.email = user.email;
            if (userData.role) {
                req.session.user.role = user.role;
            }
        }

        return res.status(200).json(user);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "Email is already in use" });
        }
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ error: "Invalid user information" });
        }
        console.error("Error updating user:", error);
        return res.status(500).json({ error: "Failed to update user" });
    }
}

export async function deleteUser(req, res) {
    try {
        const existingUser = await findUserById(req.params.id);
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const deletedSelf = String(req.user._id) === String(existingUser._id);
        await deleteBookingsByUserId(existingUser._id);
        const user = await deleteUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (deletedSelf) {
            req.session.user = null;
        }

        return res.status(200).json({ message: "User deleted", deletedSelf });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        console.error("Error deleting user:", error);
        return res.status(500).json({ error: "Failed to delete user" });
    }
}

export async function register(req, res) {
    const apiRequest = req.path.startsWith("/api/");
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email =
        typeof req.body?.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";
    const password =
        typeof req.body?.password === "string" ? req.body.password : "";
    const confirmPassword =
        req.body?.["confirm-password"] ?? req.body?.confirmPassword;

    if (!name || !email || !password || (!apiRequest && !confirmPassword)) {
        if (apiRequest) {
            return res
                .status(400)
                .json({ error: "Name, email, and password are required" });
        }
        return res.redirect("/register");
    }

    if (confirmPassword !== undefined && confirmPassword !== password) {
        if (apiRequest) {
            return res.status(400).json({ error: "Passwords do not match" });
        }
        return res.redirect("/register");
    }

    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            if (apiRequest) {
                return res
                    .status(409)
                    .json({ error: "Email is already in use" });
            }
            return res.status(409).render("register", {
                title: "Register",
                registrationError: "Email is already in use. Try another email address.",
                oldName: name,
                oldEmail: email,
            });
        }
        const userId = await createUser(name, email, password);

        if (apiRequest) {
            return res
                .status(201)
                .json({ message: "User registered successfully", userId });
        }
        return res.redirect("/login");
    } catch (error) {
        console.error("Error registering user:", error);
        if (error.code === 11000) {
            if (apiRequest) {
                return res
                    .status(409)
                    .json({ error: "Email is already in use" });
            }
            return res.status(409).render("register", {
                title: "Register",
                registrationError: "Email is already in use. Try another email address.",
                oldName: name,
                oldEmail: email,
            });
        }
        if (apiRequest) {
            return res
                .status(500)
                .json({
                    error: "An error occurred during registration. Please try again.",
                });
        }
        return res.redirect("/register");
    }
}
