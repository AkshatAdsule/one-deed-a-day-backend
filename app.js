require('dotenv').config();
require('ejs');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo') (session);

mongoose.connect(`mongodb+srv://admin:${process.env.ATLAS_KEY}@one-deed-a-day.iudkb.mongodb.net/one-deed-a-day?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

const userSchema = mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});
const User = mongoose.model('user', userSchema);

const deedSchema = mongoose.Schema({
    title: {
        type: String,
        unique: true,
        required: true
    }, 
    description: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    completedUsers: {
        type: Array
    }
});
const Deed = mongoose.model('deed', deedSchema);

const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser())
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));
app.set('view engine', 'ejs');

// Utility routes
app.get('/_info', function(req, res) {
    res.send(req.session);
});

// App routes
app.get('/', function (req, res) {
    res.render('about');
});

app.get('/register', function (req, res) {
    res.render('register');
});

app.post('/register', function (req, res) {
    bcrypt.hash(req.body.password, 10, function (err, hash) {
        if (!err) {
            User.create({
                email: req.body.email,
                username: req.body.username,
                password: hash
            }, function (err, newUser) {
                if (!err) {
                    req.session.username = newUser.username;
                    res.redirect('/');
                }
            });
        }
    });

});

app.get('/login', function(req, res) {
    res.render('login');
});

app.post('/login', function(req, res) {
    User.findOne({
        email: req.body.email
    }, function(dbErr, user) {
        if(!dbErr) {
            bcrypt.compare(req.body.password, user.password, function(hashErr, same) {
                if(!hashErr && same) {
                    req.session.username = user.username;
                    res.send('logged in');
                } else {
                    res.send("hashErr")
                }
            });
        } else {
            res.send("dbErr");
        }
        
    });
});

app.get('/logout', function(req, res) {
    req.session.username = null;
    res.redirect('/');
});

app.get('/home', function(req, res) {
    if(req.session.username) {
        res.render('home');
    }
})

app.get('/create', function(req, res) {
    req.session.username !== null ? res.render('create') : res.redirect('/');
});

app.post('/create', function(req, res) {
    console.log(req.body)
    Deed.create({
        title: req.body.title,
        description: req.body.description,
        author: req.session.username,
        completedUsers: []
    }, function(creatErr) {
        !creatErr ? res.redirect('/home') : res.send('Err :' + creatErr);
    })
});


app.listen(process.env.PORT || 7000, function () {
    console.log('Server is running on 7000');
});