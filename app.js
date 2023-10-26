//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const app = express();
const port  = 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb+srv://admin-joseph:olisa312@cluster0.ydqmrha.mongodb.net/AuthDB")
     .then(() => {
        console.log("Connected to database successfully");
     })
     .catch(() => {
        console.log("Failed to connect to database")
     });


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = new mongoose.model("User", userSchema);

app.get("/", (req,res) => {
    res.render("home");
});

app.get("/login", (req,res) => {
    res.render("login");
});


app.get("/register", (req,res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: await bcrypt.hash(req.body.password, 15)
    });

    await newUser.save()
      .then(() => {
        console.log("Succesfully saved new user");
        res.render("secrets");
      })
      .catch((err) => {
        console.log(err.message);
      })
});

app.post("/login", async (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    await User.findOne({email: username})
       .then(async (result) => {
           console.log(`user ${result._id} found in database`);
           if(await bcrypt.compare(password, result.password)){
              res.render("secrets");
           }
           else{
             res.redirect("/login");
           }
       })
       .catch(err => {
            console.log(err.message);
            res.redirect("/login");
       })
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})