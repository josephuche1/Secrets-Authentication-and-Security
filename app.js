//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from "passport-local-mongoose";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import findOrCreate from "mongoose-findorcreate";

const app = express();
const port  = 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

// set up sessions to have a secret, set the resave option to false and the saveUninitialzed to false
app.use(session({
    secret: "my little secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize()); // initialize passport
app.use(passport.session()); // learn more on passport later. use passport to manage sessions.


mongoose.connect("mongodb+srv://admin-joseph:olisa312@cluster0.ydqmrha.mongodb.net/AuthDB")
     .then(() => {
        console.log("Connected to database successfully");
     })
     .catch(() => {
        console.log("Failed to connect to database")
     });


const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String, 
    secret: String
});

userSchema.plugin(passportLocalMongoose); // has to be a mongoose schema. set up userSchema to use passportLocalMongoose as a plugin
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); // create a strategy to authenticate our users using their username and password.

passport.serializeUser(User.serializeUser()); // Serialze creates a cookie and saves the user info there
passport.deserializeUser(User.deserializeUser()); // gets the user info from the cookie

// using google strategy to login users
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id, username:profile.displayName }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req,res) => {
    res.render("home");
});

app.get("/login", (req,res) => {
    res.render("login");
});

// Integrating google authentication with web application
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to.
    res.redirect('/secrets');
  });

app.get("/register", (req,res) => {
    res.render("register");
});

app.get("/secrets", async (req,res) => {
    await User.find({"secret":{$ne:null}})
        .then((users) => {
            res.render("secrets.ejs", {usersWithSecrets: users})
        }).catch((err) => {
            console.log(err);
        })
});

app.post("/register", async (req, res) => {
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if(err){
            console.log(err);
            res.redirect("/register");
        } else{
            passport.authenticate("local")(req,res, () => {
                res.redirect("/secrets");
            });
        }
    })
});

app.post("/login", async (req,res) => {
   const user = new User({
      username: req.body.username,
      password:req.body.password
   });

   req.login(user, (err) =>{
      if(err){
        console.log(err);
      }
      else{
        passport.authenticate("local")(req,res, () => {
            res.redirect("/secrets");
        });
      }
   });
});

app.get("/logout", (req,res) => {
    req.logout(() => {
        res.redirect("/");
    })
    
});

app.get("/submit", async (req, res) => {
    if(req.isAuthenticated()){
        res.render("submit.ejs");
    }
    else{
        res.redirect("/login");
    }
});

app.post("/submit", async (req,res) => {
    const secret  = req.body.secret;

    const user = await User.findById(req.user._id);
    if(user){
        user.secret = secret;
        user.save();
        res.redirect("/secrets");
    } else{
        res.redirect("/secrets");
    }
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})