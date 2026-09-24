import {
    getAllStations as findAllStations,
    getStationById as findStationById,
} from "../models/stations.js";

import { createUser, findUserByEmail, verifyPassword } from "../models/users.js";

export async function getAllStations(req, res) {
    try {
        const stations = await findAllStations();

        return res.status(200).json(stations);
    } catch (error) {
        console.error("Error fetching stations:", error);

        return res.status(500).json({
            error: "Failed to fetch stations",
        });
    }
}

export async function getStationById(req, res) {
    try {
        const { id } = req.params;

        const station = await findStationById(id);

        if (!station) {
            return res.status(404).json({
                error: "Station not found",
            });
        }

        return res.status(200).json(station);
    } catch (error) {
        console.error("Error fetching station:", error);

        return res.status(500).json({
            error: "Failed to fetch station",
        });
    }
}

export async function register(req, res) {
    const { name, email, password } = req.body;

    try {
        // Create the user in the database, model function will create the hash.
        const userId = await createUser(name, email, password);

        // Redirect to the home page after successful registration
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        req.flash('error', 'An error occurred during registration. Please try again.');
        res.redirect('/register');
    }
};

export async function login(req, res) {
    const { email, password } = req.body;

    try {
        const user = await findUserByEmail(email);
        const authenticated = user && await verifyPassword(password, user.passwordHash);
        
        if (authenticated) {
            // Store user info in session
            req.session.user = user;
            req.flash('success', 'Login successful!');

            if (res.locals.NODE_ENV === 'development') {
                console.log('User logged in:', user);
            }

            res.redirect('/');
        } else {
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error during login:', error);
        req.flash('error', 'An error occurred during login. Please try again.');
        res.redirect('/login');
    }
};

export async function logout(req, res) {
    if (req.session.user) {
        delete req.session.user;
    }

    req.flash('success', 'Logout successful!');
    res.redirect('/login');
};
