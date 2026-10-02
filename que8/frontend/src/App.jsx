
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/students";

function App() {
    const [students, setStudents] = useState([]);
    const [form, setForm] = useState({
        name: "",
        email: "",
        course: "",
        age: ""
    });
    const [editId, setEditId] = useState(null);
    const [message, setMessage] = useState("");

    // Read all students
    const loadStudents = async () => {
        try {
            const res = await fetch(API);
            const data = await res.json();
            setStudents(data);
        } catch (err) {
            setMessage("Cannot connect to the server");
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    // Handle input fields
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    // Create or update student
    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = editId ? `${API}/${editId}` : API;
        const method = editId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...form,
                    age: Number(form.age)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || data.message);
                return;
            }

            setMessage(
                editId
                    ? "Student updated successfully"
                    : "Student added successfully"
            );

            setForm({
                name: "",
                email: "",
                course: "",
                age: ""
            });

            setEditId(null);
            loadStudents();
        } catch (err) {
            setMessage("Cannot connect to the server");
        }
    };

    // Load student data into the form
    const handleEdit = (student) => {
        setEditId(student.id);
        setForm({
            name: student.name,
            email: student.email,
            course: student.course,
            age: String(student.age)
        });
        setMessage("");
    };

    // Delete student
    const handleDelete = async (id) => {
        if (!window.confirm("Do you want to delete this student?")) {
            return;
        }

        try {
            const res = await fetch(`${API}/${id}`, {
                method: "DELETE"
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || data.error);
                return;
            }

            setMessage(data.message);
            if (editId === id) {
                setEditId(null);
                setForm({
                    name: "",
                    email: "",
                    course: "",
                    age: ""
                });
            }

            loadStudents();
        } catch (err) {
            setMessage("Cannot connect to the server");
        }
    };

    const cancelEdit = () => {
        setEditId(null);
        setForm({
            name: "",
            email: "",
            course: "",
            age: ""
        });
        setMessage("");
    };

    return (
        <div className="container">
            <h1>Student Management System</h1>

            <h2>{editId ? "Edit Student" : "Add Student"}</h2>

            <form onSubmit={handleSubmit}>
                <input
                    name="name"
                    placeholder="Enter name"
                    value={form.name}
                    onChange={handleChange}
                    required
                />

                <input
                    name="email"
                    type="email"
                    placeholder="Enter email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                <input
                    name="course"
                    placeholder="Enter course"
                    value={form.course}
                    onChange={handleChange}
                    required
                />

                <input
                    name="age"
                    type="number"
                    min="1"
                    placeholder="Enter age"
                    value={form.age}
                    onChange={handleChange}
                    required
                />

                <button type="submit">
                    {editId ? "Update Student" : "Add Student"}
                </button>

                {editId && (
                    <button
                        type="button"
                        onClick={cancelEdit}
                    >
                        Cancel
                    </button>
                )}
            </form>

            {message && <p>{message}</p>}

            <h2>Student List</h2>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Course</th>
                            <th>Age</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {students.map((student) => (
                            <tr key={student.id}>
                                <td>{student.id}</td>
                                <td>{student.name}</td>
                                <td>{student.email}</td>
                                <td>{student.course}</td>
                                <td>{student.age}</td>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(student)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(student.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {students.length === 0 && (
                            <tr>
                                <td colSpan="6">No students found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default App;