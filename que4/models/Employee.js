const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
    empid: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    basicSalary: {
        type: Number,
        required: true,
        min: 0
    },
    hra: Number,
    da: Number,
    pf: Number,
    grossSalary: Number,
    netSalary: Number,
    password: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Employee", employeeSchema);