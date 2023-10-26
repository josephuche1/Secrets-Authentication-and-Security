//jshint esversion:6

import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import mongoose from "mongoose";

const app = express();
const port  = 3000;

mongoose.connect("mongodb+srv://admin-joseph:olisa312@cluster0.ydqmrha.mongodb.net/AuthDB")
     .then(() => {
        console.log("Connected to database successfully");
     })
     .catch(() => {
        console.log("Failed to connect to database")
     })

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));


app.get("/", (req,res) => {
    res.render("home");
})

app.get("/login", (req,res) => {
    res.render("login");
})


app.get("/register", (req,res) => {
    res.render("register");
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})