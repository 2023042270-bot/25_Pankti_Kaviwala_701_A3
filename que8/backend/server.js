
const express = require("express");
const cors = require("cors");
const sequelize = require("./database");
const Student = require("./models/Student");

const app = express();

app.use(cors());
app.use(express.json());

// READ: Get all students
app.get("/students", async (req, res) => {
    try {
        const students = await Student.findAll();
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE: Add student
app.post("/students", async (req, res) => {
    try {
        const student = await Student.create(req.body);
        res.status(201).json(student);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// UPDATE: Update student
app.put("/students/:id", async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        await student.update(req.body);
        res.json(student);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE: Delete student
app.delete("/students/:id", async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        await student.destroy();
        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Connect database and start server
async function startServer() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        app.listen(5000, () => {
            console.log("Server running at http://localhost:5000");
        });
   } catch (err) {
    console.error("Database connection failed:");
    console.error(err);
}
}

startServer();