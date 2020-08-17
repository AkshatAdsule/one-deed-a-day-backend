require('dotenv').config();
require('ejs');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

mongoose.connect(`mongodb+srv://admin:${process.env.ATLAS_KEY}@one-deed-a-day.iudkb.mongodb.net/one-deed-a-day?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
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

const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');

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
            }, function (err) {
                if (!err) {
                    res.redirect('/');
                }
            });
        }
    });

})

app.listen(7000, function () {
    console.log('Server is running on 7000');
});