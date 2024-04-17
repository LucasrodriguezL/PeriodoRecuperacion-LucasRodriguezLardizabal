const express = require('express');
const session = require('express-session');
const mainRouter = require('./routes/main');


const app = express();

app.use(session({
  secret: 'secreto', // Clave secreta para firmar la sesión, puedes cambiarla
  resave: false,
  saveUninitialized: true
}));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.use('/', mainRouter);

app.listen(3000, () => {
  console.log('listening in http://localhost:3000');
});
