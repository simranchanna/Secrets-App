//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const ejs  = require("ejs");

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: 'werehappilymarried',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB" , { useNewUrlParser: true , useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req,res)=>{
    res.render("home");
});

app.get("/login", (req,res)=>{
    res.render("login");
});

app.get("/register", (req,res)=>{
    res.render("register");
});

app.get("/submit", (req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
});

app.get("/login", (req,res)=>{
    res.render("login");
});

app.get("/logout", (req,res)=>{
    req.logout();
    res.redirect("/");
})

app.get("/secrets", (req,res)=>{
    User.find({"secret": {$ne: null}} , function(err , foundUsers){
        if(err){
            console.log(err);
        }
        else{
            if(foundUsers){
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
    })
});

app.post("/submit", (req,res)=>{
    const newsecret = req.body.secret;
    console.log(req.user);

    User.findById(req.user.id , function(err,foundUser){
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                foundUser.secret = newsecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                })
            }
        }
    })
})

app.post("/register", (req,res)=>{

    User.register({username: req.body.username}, req.body.password , function(err, user) {
        if (err) { 
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }    
    });
})

app.post("/login", (req,res)=>{

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user , function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
})

app.listen(3000,()=>{
    console.log("server running on port 3000");
})

