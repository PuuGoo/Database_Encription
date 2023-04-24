//jshint esversion:6
//Lever 2 Encription
import * as dotenv from "dotenv"
dotenv.config()
import express from "express"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import ejs from "ejs"
import bcrypt from "bcrypt"
const saltRounds = 10;
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

const User = mongoose.model("User", userSchema);

const app = express();

app.set('view engine', "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



app.get("/", function(req,res){
    res.render("home");
});

app.route("/login")
.get(function(req,res){
    res.render("login");
})
.post(function(req,res){
    const password = req.body.password;
    User.findOne({email: req.body.username})
    .then(function(foundUser){
        if(foundUser){
            bcrypt.compare(password, foundUser.password)
            .then(function(result){
                if(result === true){
                    res.render("secrets");
                }
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

app.route("/register")
.get(function(req,res){
    res.render("register");
})
.post(function(req,res){
    bcrypt.hash(req.body.password, saltRounds)
    .then(function(hash){
        const user = new User({
            email: req.body.username,
            password: hash
        });
        user.save()
        .then(function(){
            console.log("Successfully saved a user data.");
        })
        .catch(function(err){
            console.log(err);
        });
        res.render("secrets");
    })
    .catch(function(err){
        console.log(err);
    });
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});

}