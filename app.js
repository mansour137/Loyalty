require('dotenv').config();
const express = require("express");
const ejs = require('ejs');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const globals = require("./global")
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret:"thisissecret",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost/Loyalty", { useNewUrlParser: true });
// mongoose.set("useCreateIndex", true);

const playerSchema = new mongoose.Schema({
    id: String,
    username:String,
    numFriends:Number,
    friends: [{
        name: String,
        sentence: String
    }]
});


// playerSchema.plugin(passportLocalMongoose);
playerSchema.plugin(findOrCreate);
const Player = mongoose.model('Player' , playerSchema);

// passport.use(Player.createStrategy());
// mongoose.set({"useCreateIndex":true})
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        cb(null, { id: user.id });
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/setNames",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"

    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        Player.findOrCreate({ id: profile.id , username:profile.displayName }, function (err, user) {
            globals.setIdPlayer(profile.id)
            return cb(err, user);
        });
    }
));



app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/setNames',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/setNames');
    });

app.get('/' ,(req,res)=>{
    res.render('home');
});

app.get("/login",(req,res)=>{
    res.render('loginOrRegestier');
});

app.get('/setNames', (req, res) => {
  if( req.isAuthenticated()){
      res.render('namesAndSentence', {player: 0});
  }else{
      res.redirect('/login')
  }
});
app.post('/setNames', (req, res) => {
    // res.redirect('/setNames');
    const numPlayer = req.body.number;
    globals.setNumPlayer(numPlayer)
    res.render('namesAndSentence', { player: numPlayer });
});

app.get('/play', (req, res) => {
    const playerID = globals.getIdPlayer();
    const arr_sentences = [];
    console.log(playerID)
    Player.findOne({ id: playerID })
        .then((player) => {
            if (player) {
                player.friends.forEach((friend) => {
                    arr_sentences.push(friend.sentence);
                });
            }
            console.log(arr_sentences);
           let randomIndex = Math.floor(Math.random() * arr_sentences.length);
           let name_of_sentense ;
           console.log(arr_sentences[randomIndex],randomIndex);
            player.friends.forEach((friend) => {
                if(friend.sentence == arr_sentences[randomIndex]){
                    console.log(friend.name);
                    name_of_sentense = friend.name;
                }
            });
            res.render('play');
        })
        .catch((error) => {
            console.error(error);
            res.render('play');
        });

});


app.post('/play', (req, res) => {
    const numPlayer = globals.getNumPlayer(); // Corrected variable name

    const idPlayer = globals.getIdPlayer();
    // console.log(idPlayer)
    // console.log(numPlayer);
    const friend = [];
    for (let i = numPlayer; i > 0; i--) {
        let name = req.body['name' + i];
        let sentence = req.body['sentence' + i];
        friend.push({name,sentence})
    }
    // console.log(friend)
    Player.findOneAndUpdate({ id: idPlayer }, {
        friends: friend,
        numFriends :numPlayer
    })
        .then((result) => {
            console.log("ADDED");
            res.render('play', { user: result });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("An error occurred");
        });

})

app.listen(3000,()=>{
    console.log('server running on port 3000')
})