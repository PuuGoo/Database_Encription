//jshint esversion:6
//Lever 2 Encription //i dotenv: goi dung de giu key
//Lever 3 hash // i md5
//Lever 4 bcrypt // i bcrypt
//Lerver 5 passport// i passport passport-local passport-local-mongooose express-session NOT express-sessions
//Lerver 6
import * as dotenv from "dotenv"
dotenv.config()
import express from "express"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import ejs from "ejs"
import session from "express-session"
import passport from "passport"
import passportLocalMongoose from "passport-local-mongoose"


main().catch(function(err){
    console.log(err);
});

async function main(){

await mongoose.connect("mongodb://127.0.0.1:27017/userDB");
console.log("Succesfully connected");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(user, done) {
    done(null, user);
});

const app = express();

app.set('view engine', "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
    secret: "thisisyoursecrectsoyoushouldgiveithowtocarefully.",
    resave: false,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());

app.get("/", function(req,res){
    res.render("home");
});

app.get("/secrets", function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err);
        } else {
            res.redirect("/");
        }
    });

});

app.route("/register")
.get(function(req,res){
    res.render("register");
})
.post(function(req,res){
    User.register({username: req.body.username}, req.body.password)
    .then(function(user){
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        });
    })
    .catch(function(err){
        console.log(err);
        res.redirect("/register");
    });
});

app.route("/login")
.get(function(req,res){
    res.render("login");
})
.post(function(req,res){
    const user = new User({
        email: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});

}