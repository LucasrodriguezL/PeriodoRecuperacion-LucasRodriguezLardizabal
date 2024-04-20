const bcryptjs = require('bcryptjs');
const db = require('../database/models');
const { Op } = require('sequelize');

const mainController = {
  home: (req, res) => {
    const user = req.session.user || null; // Verifica si hay un usuario en la sesión
    db.Book.findAll({
      include: [{ association: 'authors' }]
    })
      .then((books) => {
        res.render('home', { books, user }); // Pasa la variable user al renderizar la vista
      })
      .catch((error) => console.log(error));
  },
  bookDetail: (req, res) => {
    const bookId = req.params.id;  // Obtener el Id del libro de los parámetros de la ruta
    db.Book.findByPk(bookId, { include: [{ association: 'authors' }] })  // Buscar el libro por su Id en la base de datos
      .then((book) => {
        if (!book) {
          return res.status(404).send('Book not found');
        }
        const user = req.session.user || null; // Obtener el usuario de la sesion
        res.render('bookDetail', { book, user });// Renderizar la vista con los datos del libro y el usuario
      })
      .catch((error) => console.log(error));
  },
  bookSearch: (req, res) => {
    const user = req.session.user || null;
    res.render('search', { books: [], user });
  },
  bookSearchResult: async (req, res) => {
    try {
      const searchTerm = req.body.title;

    // Realiza la búsqueda de libros en la base de datos
      const books = await db.Book.findAll({
        where: {
          title: { [Op.like]: `%${searchTerm}%` }  // Utiliza Sequelize para buscar títulos que contengan el término de búsqueda
        },
        include: [{ association: 'authors' }] // Incluye la asociación de autores en los resultados de la búsqueda
      });
       // Renderiza la vista de resultados de búsqueda y pasa los libros encontrados como datos
       const user = req.session.user || null;
      res.render('search', { books, user });
    } catch (error) {
      console.error('Error al buscar libros:', error);
      res.status(500).send('Error interno del servidor');
    }
  },
  deleteBook: (req, res) => {
    const bookId = req.params.id;
    // Aquí iría la lógica para eliminar el libro con el id bookId
    // Después de eliminar el libro, redirige al usuario a la página de inicio
    res.redirect('/');
  },
  authors: (req, res) => {
    db.Author.findAll()
      .then((authors) => {
        const user = req.session.user || null; // Obtener el usuario de la sesion
        res.render('authors', { authors , user }); // Pasar el objeto user a la vista
      })
      .catch((error) => console.log(error));
  },
  authorBooks: async (req, res) => {
    try {
      const authorId = req.params.id;
      const author = await db.Author.findByPk(authorId, { include: 'Books' }); // Incluye los libros del autor
      if (!author) {
        return res.status(404).send('Author not found');
      }
      const user = req.session.user || null; // Obtener el usuario de la sesión
      res.render('authorBooks', { author, user }); // Pasar el objeto user a la vista
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  },
  register: (req, res) => {
    res.render('register');
  },
  processRegister: (req, res) => {
    db.User.create({
      Name: req.body.name,
      Email: req.body.email,
      Country: req.body.country,
      Pass: bcryptjs.hashSync(req.body.password, 10),
      CategoryId: req.body.category
    })
      .then(() => {
        res.redirect('/');
      })
      .catch((error) => console.log(error));
  },
  login: (req, res) => {
    res.render('login');
  },
  processLogin: async (req, res) => {
    try {
      const { email, password } = req.body;
       // Buscar al usuario por su correo electrónico en la base de datos
      const user = await db.User.findOne({ where: { Email: email } });
       // Verificar si el usuario existe y la contraseña es válida
      if (!user || !bcryptjs.compareSync(password, user.Pass)) {
        return res.status(401).render('login', { error: 'Email or password is incorrect' });
      }
       // Crear una sesión de usuario
      req.session.user = {
        id: user.id,
        email: user.Email,
        isAdmin: user.CategoryId === 1  // Si el CategoryId es 1, el usuario es administrador
      };
       // Redirigir al usuario a la página de inicio
      res.redirect('/');
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  },
  logout: (req, res) => {
     // Destruir la sesión de usuario
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
        return res.status(500).send('Internal Server Error');
      }
      // Redirigir al usuario a la página de inicio
      res.redirect('/');
    });
  },
  edit: (req, res) => {
    const user = req.session.user || null;
    res.render('editBook', { id: req.params.id, user }  );
  },
  processEdit: async (req, res) => {
    try {
      const bookId = req.params.id;
      const { title, author, releaseDate, description } = req.body;
      const updatedBook = await db.Book.update(
        {
          title,
          author,
          releaseDate,
          description
        },
        { where: { id: bookId } }
      );
      res.redirect(`/books/detail/${bookId}`);
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  }
};

module.exports = mainController;
