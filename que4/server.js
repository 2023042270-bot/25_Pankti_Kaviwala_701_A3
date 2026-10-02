
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require("path");

const Admin = require("./models/Admin");
const Employee = require("./models/Employee");

const app = express();
const PORT = process.env.PORT || 3000;

// EJS and form settings
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

// Session stored in MongoDB
app.use(session({
    name: "erp.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI
    }),
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // Set true when using HTTPS
        maxAge: 1000 * 60 * 30
    }
}));

// Protect admin pages
function isAdmin(req, res, next) {
    if (req.session.adminId) {
        return next();
    }

    res.redirect("/login");
}

// Calculate salary
function calculateSalary(basic) {
    const hra = basic * 0.20; // 20% HRA
    const da = basic * 0.10;  // 10% DA
    const pf = basic * 0.12;  // 12% PF

    const grossSalary = basic + hra + da;
    const netSalary = grossSalary - pf;

    return {
        hra,
        da,
        pf,
        grossSalary,
        netSalary
    };
}

// Email configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Login page
app.get("/login", (req, res) => {
    res.render("login", { error: null });
});

// Admin login
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const admin = await Admin.findOne({ username });

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).render("login", {
                error: "Invalid username or password"
            });
        }

        // Prevent session fixation
        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).send("Session error");
            }

            req.session.adminId = admin._id.toString();
            res.redirect("/dashboard");
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Login failed");
    }
});

// Dashboard
app.get("/dashboard", isAdmin, async (req, res) => {
    const totalEmployees = await Employee.countDocuments();

    res.render("dashboard", { totalEmployees });
});

// View employees
app.get("/employees", isAdmin, async (req, res) => {
    const employees = await Employee.find().sort({ createdAt: -1 });

    res.render("employees", { employees });
});

// Add employee form
app.get("/employees/add", isAdmin, (req, res) => {
    res.render("add-employee", { error: null });
});

// Insert employee
app.post("/employees/add", isAdmin, async (req, res) => {
    try {
        const { name, email, department, basicSalary } = req.body;
        const basic = Number(basicSalary);

        if (
            !name?.trim() ||
            !email?.trim() ||
            !department?.trim() ||
            !Number.isFinite(basic) ||
            basic <= 0
        ) {
            return res.status(400).render("add-employee", {
                error: "Enter valid employee details and a salary greater than zero."
            });
        }

        // Generate unique employee ID and temporary password
        const empid = "EMP" + crypto.randomBytes(4).toString("hex").toUpperCase();
        const temporaryPassword = crypto.randomBytes(9).toString("base64url");

        // Hash password before storing it
        const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
        const salary = calculateSalary(basic);

        const employee = await Employee.create({
            empid,
            name: name.trim(),
            email: email.trim(),
            department: department.trim(),
            basicSalary: basic,
            ...salary,
            password: hashedPassword
        });

        // Send the generated login details by email
        let emailMessage = "Employee added, but email could not be sent.";

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: employee.email,
                subject: "Your ERP Employee Account",
                text:
                    `Hello ${employee.name},\n\n` +
                    `Your employee account has been created.\n` +
                    `Employee ID: ${employee.empid}\n` +
                    `Temporary Password: ${temporaryPassword}\n\n` +
                    `Please log in and change your password.\n`
            });

            emailMessage = "Employee added and email sent successfully.";
        } catch (mailError) {
            console.error("Email error:", mailError.message);
        }

        res.render("employees", {
            employees: await Employee.find().sort({ createdAt: -1 }),
            message: emailMessage
        });
    } catch (err) {
        console.error(err);

        if (err.code === 11000) {
            return res.status(409).send("Duplicate employee ID. Please try again.");
        }

        res.status(500).send("Could not add employee.");
    }
});

// Edit employee form
app.get("/employees/edit/:id", isAdmin, async (req, res) => {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
        return res.status(404).send("Employee not found");
    }

    res.render("edit-employee", { employee, error: null });
});

// Update employee
app.post("/employees/edit/:id", isAdmin, async (req, res) => {
    try {
        const { name, email, department, basicSalary } = req.body;
        const basic = Number(basicSalary);

        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).send("Employee not found");
        }

        if (
            !name?.trim() ||
            !email?.trim() ||
            !department?.trim() ||
            !Number.isFinite(basic) ||
            basic <= 0
        ) {
            return res.status(400).render("edit-employee", {
                employee,
                error: "Enter valid details and a salary greater than zero."
            });
        }

        Object.assign(employee, {
            name: name.trim(),
            email: email.trim(),
            department: department.trim(),
            basicSalary: basic,
            ...calculateSalary(basic)
        });

        await employee.save();

        res.redirect("/employees");
    } catch (err) {
        console.error(err);
        res.status(500).send("Could not update employee.");
    }
});

// Delete employee
app.post("/employees/delete/:id", isAdmin, async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.redirect("/employees");
    } catch (err) {
        console.error(err);
        res.status(500).send("Could not delete employee.");
    }
});

// Logout
app.post("/logout", isAdmin, (req, res, next) => {
    req.session.destroy((err) => {
        if (err) return next(err);

        res.clearCookie("erp.sid");
        res.redirect("/login");
    });
});

// Connect to MongoDB and create initial admin
async function startServer() {
    if (
        !process.env.SESSION_SECRET ||
        !process.env.ADMIN_USERNAME ||
        !process.env.ADMIN_PASSWORD
    ) {
        throw new Error("Set SESSION_SECRET and admin credentials in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    let admin = await Admin.findOne({
        username: process.env.ADMIN_USERNAME
    });

    if (!admin) {
        const hashedPassword = await bcrypt.hash(
            process.env.ADMIN_PASSWORD,
            12
        );

        await Admin.create({
            username: process.env.ADMIN_USERNAME,
            password: hashedPassword
        });

        console.log("Initial admin account created");
    }

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

startServer().catch((err) => {
    console.error("Startup error:", err);
    process.exit(1);
});