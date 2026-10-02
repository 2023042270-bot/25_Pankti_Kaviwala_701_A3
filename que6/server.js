const express = require("express");
const path = require("path");
const app = express()
app.use(express.static("public"));

app.listen(8000, () => {
    console.log("Listening at 8000 port..")
})
app.get("/", (req, res) => {
    res.send("Products");
})

app.get("/data", (req, res) => {
    console.log("got response")
    fetch("https://dummyjson.com/products")
        .then(response => response.json())
        .then(data => res.send(data))
        .catch(error => res.send("Error fetching data"));

})
