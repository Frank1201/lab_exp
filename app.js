// LOAD MODULES 
var express = require("express"),
    app = express(),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    path = require('path'),
    User = require('./models/user'),
    DataLibrary = require('./models/datalibrary')

var showRoutes = require('./routes/show'),
    indexRoutes = require('./routes/index'),
    datalibraryRoutes = require('./routes/datalibrary'),
    vizRoutes = require('./routes/viz'),
    authRoutes = require('./routes/auth')
    downloadsRoutes = require('./routes/downloads'),
    deleteRoutes = require('./routes/delete')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.set("view engine", "ejs"); // use ejs template engine for rendering

mongoose.connect('mongodb://localhost/datalibrary',
    { useUnifiedTopology: true, useNewUrlParser: true }, function (err) {
        if (err) { console.log('Not connected to database!'); } else {
            console.log('Successfully connected to database.')
        }
    }
);

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Welcome to Anthrope.",  // USED TO DECODE INFO IN THE SESSION, STILL TRYING TO FIGURE IT OUT
    resave: false, 
    saveUninitialized: false
}));

app.use(passport.initialize()); // SET UP PASSPORT
app.use(passport.session());    // SET UP PASSPORT
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()); // USED TO READING DATA FROM THE SESSION, WHAT DATA OF THE USER SHOULD BE STORED IN THE SESSION?
passport.deserializeUser(User.deserializeUser()); // USED TO DECODE THE DATA FROM THE SESSION

// // TELL EXPRESS TO USE THE FOLLOWING LIBRARIES/FILES
app.use('/tasks', express.static(__dirname + "/tasks"));
app.use('/surveys', express.static(__dirname + "/surveys"));
app.use('/studies', express.static(__dirname + "/studies"));
app.use('/jsPsych', express.static(__dirname + "/jsPsych"));
app.use('/libraries', express.static(__dirname + "/libraries"));
app.use('/public', express.static(__dirname + "/public"));
app.use('/views', express.static(__dirname + "/views"));

app.use(indexRoutes);
app.use(datalibraryRoutes);
app.use(showRoutes);
app.use(vizRoutes);
app.use(downloadsRoutes);
app.use(deleteRoutes);
app.use(authRoutes);

// Handle 404
app.use(function (req, res) {
    // res.redirect('/public/404.html');
    var c = req.originalUrl.split('/').length - 1;
    var c = "../".repeat(c);
    const c1 = c + "public/assets/css/loaders/loader-typing.css";
    const c2 = c + "public/assets/css/theme.css";
    res.status(404).render("404", { c1: c1, c2: c2 });
});

// Handle 500
app.use(function (error, req, res, next) {
    // res.redirect('/public/500.html'); 
    var c = req.originalUrl.split('/').length - 1;
    var c = "../".repeat(c);
    const c1 = c + "public/assets/css/loaders/loader-typing.css";
    const c2 = c + "public/assets/css/theme.css";
    res.status(500).render("500", { c1: c1, c2: c2 });
});

// START SERVER
app.listen(process.env.PORT || 8080);
console.log("Server started on port 8080");