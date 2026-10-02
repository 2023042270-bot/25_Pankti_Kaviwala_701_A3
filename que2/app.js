// const express=require("express");
// const app=express();

// app.use(express.static("static"));

// app.use(express.urlencoded({extended:false}))

// app.listen(8000,()=>{
//     console.log("Listening at 8000 port..")
// })

// app.use("/",(req,res,next)=>{
//     console.log(req.method + " " + req.url + " Requested");
//     next();
// })

// app.get("/",(req,res)=>{
//     res.send("Hello Express!!")
// })

// app.get("/page1",(req,res)=>{
//     res.send("Page1")
// })

// app.get("/page2",(req,res)=>{
//     res.send("Page2")
// })

const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(
  session({
    store: new FileStore({
      path: "./sessions",
      retries: 0,
    }),
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 30, // 30 minutes
      httpOnly: true,
    },
  })
);

// Login page
app.get("/", (req, res) => {
  res.send(`
    <h1>Login</h1>

    <form method="POST" action="/login">
      <input
        type="text"
        name="username"
        placeholder="Username"
        required
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        required
      />

      <button type="submit">Login</button>
    </form>
  `);
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Demo credentials
  if (username === "admin" && password === "1234") {
    req.session.user = {
      username: username,
    };

    return res.redirect("/dashboard");
  }

  res.status(401).send("Invalid username or password");
});

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }

  res.status(401).send(`
    <h2>Unauthorized</h2>
    <p>Please login first.</p>
    <a href="/">Login</a>
  `);
}

// Protected Route 1
app.get("/dashboard", isAuthenticated, (req, res) => {
  res.send(`
    <h1>Dashboard</h1>
    <p>Welcome, ${req.session.user.username}!</p>

    <a href="/profile">Profile</a>
    <br />
    <a href="/logout">Logout</a>
  `);
});

// Protected Route 2
app.get("/profile", isAuthenticated, (req, res) => {
  res.send(`
    <h1>Profile</h1>
    <p>Username: ${req.session.user.username}</p>

    <a href="/dashboard">Dashboard</a>
    <br />
    <a href="/logout">Logout</a>
  `);
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Could not log out");
    }

    res.redirect("/");
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
