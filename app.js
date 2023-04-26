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
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import findOrCreate from "mongoose-findorcreate"
import {Strategy as FacebookStrategy} from "passport-facebook"

main().catch(function(err){
    console.log(err);
});

async function main(){

await mongoose.connect("mongodb://127.0.0.1:27017/userDB");
console.log("Succesfully connected");

const userSchema = new mongoose.Schema({
    //This is a monogo error. In your mongoose schema you maybe defined as username {type string, unique:true}. So when you are storing data in DB, only one null value for username will store. After that if username field has null value duplicate error will throw. Change username field as below
    username: {
        type: String,
        index: true,
        nique: true,
        sparse: true,
    },
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user._id);
});
 
passport.deserializeUser(function(id, done) {
  User.findById(id)
  .then(function(user){
    done(err, user);
  })
  .catch(function(err){
    console.log(err);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({username: profile.emails[0].value ,googleId: profile.id }, function (err, user) {
        return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

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
    User.find({secret: {$ne: null}})
    .then(function(foundUsers){
        if(foundUsers){
            res.render("secrets", {usersWithSecrets: foundUsers});
        }
    })
    .catch(function(err){
        console.log(err);
    });
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

app.route("/submit")
.get(function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})
.post(function(req,res){
    const submittedSecret = req.body.secret;
    
    User.findById(req.user.id)
    .then(function(foundUser){
        if(foundUser){
            foundUser.secret = submittedSecret;
            foundUser.save()
            .then(function(){
                res.redirect("/secrets");
            })
            .catch(function(err){
                console.log(err);
            });
        }
    })
    .catch(function(err){
        console.log(err);
    });
});

app.get("/auth/google",
  passport.authenticate("google", { scope: [ "email", "profile" ] }
));

app.get( "/auth/google/secrets",
passport.authenticate( 'google', {
    successRedirect: "/secrets",
    failureRedirect: "/login"
}));

app.get("/auth/facebook",
    passport.authenticate('facebook'));

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
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