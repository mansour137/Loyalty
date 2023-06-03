require('dotenv').config();
const express = require("express");
const ejs = require('ejs');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const findOrCreate = require("mongoose-findorcreate");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const globals = require("./global")
const path = require('path')
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


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

mongoose.connect("mongodb+srv://admin-mansour:1372001@cluster0.y9q5zgc.mongodb.net/Loyalty", { useNewUrlParser: true });
// mongoose.set("useCreateIndex", true);

const playerSchema = new mongoose.Schema({
    id: String,
    username:String,
    numFriends:Number,
    friends: [{
        name: String,
        sentence: String,
        score: { type: Number, default: 0 },
        times:Number,
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
        callbackURL: "https://loyalty-ap5p.onrender.com/auth/google/setNames",
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
      res.render('namesANDsentence', {player: 0});
});
app.post('/setNames', (req, res) => {
    // res.redirect('/setNames');
    const numPlayer = req.body.number;
    globals.setNumPlayer(numPlayer)
    res.render('namesANDsentence', { player: numPlayer });
});




app.post('/Names', (req, res) => {
    const numPlayer = globals.getNumPlayer();
    const idPlayer = globals.getIdPlayer();

    const friend = [];
    for (let i = numPlayer; i > 0; i--) {
        let name = req.body['name' + i].toLowerCase();
        let sentence = req.body['sentence' + i];
        friend.push({ name, sentence });
    }

    Player.findOneAndUpdate({ id: idPlayer }, {
        friends: friend,
        numFriends: numPlayer
    })
        .then((result) => {
            console.log("ADDED");
            console.log(globals.getSentences());
            res.redirect('/play');
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("An error occurred");
        });
});

app.get('/play', (req, res) => {
    const playerID = globals.getIdPlayer();
    const arr_sentences = [];
    const name_Friends = [];
    const mix_arr = [];
    console.log(playerID);
    Player.findOne({ id: playerID })
        .then((player) => {
            if (player) {
                player.friends.forEach((friend) => {
                    arr_sentences.push(friend.sentence);
                    name_Friends.push(friend.name);
                    mix_arr.push({
                        name:friend.name,
                        sentence:friend.sentence,
                        times:( typeof  friend.times === 'undefined' ? 0 : friend.times),
                        score:( typeof  friend.score === 'undefined' ? 0 : friend.score)
                    })
                });

            }
            console.log(arr_sentences);
            console.log(name_Friends);
            console.log(mix_arr)
            globals.setFriendNameAndSentence(mix_arr);
            // Generate a random index within the range of mix_arr length
            let random_Index_for_name = Math.floor(Math.random() * name_Friends.length);
            let random_name = name_Friends[random_Index_for_name];
            name_Friends.splice(random_Index_for_name, 1);
            globals.setTurnName(random_name);
            let random_index_for_sentence = Math.floor(Math.random() * arr_sentences.length)
            let random_sentece = arr_sentences[random_index_for_sentence];
            arr_sentences.splice(random_index_for_sentence, 1);
            console.log(random_index_for_sentence,random_Index_for_name)
            globals.setSentences(random_sentece);
                res.render('play' ,{
                    TURN:random_name,
                    sentence:random_sentece
                })

        })
        .catch((error) => {
            console.error(error);
            res.render('play');
        });
});

app.post("/play", (req, res) => {
    const name_of_sentence = req.body.name.toLowerCase();
    const sentence = globals.getSentences();
    const all_name_sentence = globals.getFriendsNamesAndSentence();
    console.log(sentence, name_of_sentence);
    let match_name = false;
    let ch = false;
    all_name_sentence.forEach((result) => {
        if (result.name === name_of_sentence) {
            ch = true;
            if (result.sentence === sentence) {
                match_name = true;
            }
        }
    });
    if (match_name) {
        res.render('right');
    } else {
        if (ch) {
            res.render('wrong');
        } else {
            res.render('try_again');
        }
    }
});



app.listen(3000,()=>{
    console.log('server running on port 3000')
})
