//session storing in file using 2 authenticated routes for application

const express=require("express")
const app=express()
const port=4000
const session=require("express-session")
const file=require("session-file-store")(session)

app.set("view engine","ejs")
app.use(express.urlencoded({extended:true}))

//session configuration

app.use(session({
    store:new file({
        path:"./sessions"
    }),
    secret:"my-key",
    resave:false,
    saveUninitialized:false,
    cookie:{
        maxAge:1000*60*30
    }
}))

app.get("/test",(req,res)=>{
    res.render("test")//test.ejs will execute
})

app.get("/",(req,res)=>{
    res.render("login")
})

app.post("/login",(req,res)=>{
    const {name,password}=req.body

    if(name==="admin"&&password==="1234")
    {
        req.session.user=name
        res.redirect("/dashboard")
    }
    else{
        res.send("Invalid username and password")
    }
})

//create middleware

function authMidd(req,res,next){
    if(req.session.user){
        next()
    }
    else{
        res.send("Not authenticated")
    }
}

app.get("/dashboard",authMidd,(req,res)=>{
    res.render("dashboard",{
        name:req.session.user
    })
})

app.get("/logout",(req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            return res.send("Error in logout")
        }
        res.redirect("/")
    })
})

app.listen(port,()=>{
    console.log("running on ",port)
})