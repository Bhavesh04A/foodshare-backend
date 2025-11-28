import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id) => {
    // Generates a JWT token valid for 7 days
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const register = async(req, res) => {
    try {
        const { name, email, password, role, pinCode, zone } = req.body;
        if (!name || !email || !password || !role || !pinCode)
            return res.status(400).json({ message: "Please provide all required fields" });

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "User with this email already exists" });

        const hashedPassword = await bcrypt.hash(password, 12);

        // --- AUTOMATIC VERIFICATION LOGIC ---
        // NGOs and Volunteers are automatically verified upon registration.
        const isVerified = (role === "ngo" || role === "volunteer");

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            pinCode,
            zone: zone || "",
            verified: isVerified,
            streak: 0,
            badges: [],
        });

        res.status(201).json({
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                pinCode: user.pinCode,
                zone: user.zone,
                verified: user.verified,
                streak: user.streak,
                badges: user.badges,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error registering user" });
    }
};

export const login = async(req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "Email and password required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(401).json({ message: "Invalid credentials" });

        res.json({
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                pinCode: user.pinCode,
                zone: user.zone,
                verified: user.verified,
                streak: user.streak,
                badges: user.badges,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error logging in" });
    }
};