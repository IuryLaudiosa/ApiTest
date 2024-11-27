// server.js'
require("dotenv").config();
const authRoutes = require("../backend-tsystem/src/routes/UserRoutes")
const express = require('express');
const cors = require('cors'); 
const sequelize = require('./src/bd/database');
require('./src/models/userInvestimento'); 
const session = require('express-session');
const passport = require('./src/config/passportconfig');

const app = express();
app.use(cors()); 
app.use(express.json());
app.use("/auth", authRoutes);
// require("./src/routes/UserRoutes")(app);

app.use(passport.initialize())

app.use(
    session({
        secret: '1010FFF',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, 
    })
);



sequelize.sync().then(() => {
  app.listen(3000, "192.168.2.100", () => {
    console.log('Servidor rodando na porta 3000');
  });
}).catch((err) => console.log(err));