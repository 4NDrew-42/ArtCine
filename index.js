const express = require('express');
const passport = require('passport');
require('./passport');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const uuid = require('uuid');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const Models = require('./models.js');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');

const Movies = Models.Movie;
const Users = Models.User;

/*mongoose.connect("mongodb://localhost:27017/ACDB", { useNewUrlParser: true, useUnifiedTopology: true });*/

mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors');
app.use(cors());

//Limit Access to API
/*let allowedOrigins = ["http://localhost:8080", "http://testsite.com"];

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			if (allowedOrigins.indexOf(origin) === -1) {
				// If a specific origin isn't found on the list of allowed origins
				let message = "The CORS policy for this application doesn't allow access from origin " + origin;
				return callback(new Error(message), false);
			}
			return callback(null, true);
		},
	})
); */

let auth = require('./auth')(app);

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

app.get('/documentation', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'documentation.html'));
});

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ROUTING

// Get all users
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Users.find()
		.then((users) => {
			res.status(200).json(users);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});
// Get a user by username
app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		const user = await Users.findOne({ username: req.params.username });
		if (!user) {
			return res.status(404).send('User not found');
		}
		res.status(200).json(user);
	} catch (err) {
		console.error(err);
		res.status(500).send('Error: ' + err);
	}
});

// #1 JSON data for movies
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.find()
		.then((movies) => {
			res.status(200).json(movies);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});
// #2 JSON data for a single movie by title
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.findOne({ title: req.params.title })
		.then((movie) => {
			res.status(201).json(movie);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});
// #3 JSON data for a genre by name
app.get('/movies/genre/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.findOne({ 'genre.name': req.params.name })
		.then((movie) => {
			res.status(201).json(movie.genre);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});
// #4 JSON data for a director by name
app.get('/movies/director/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.findOne({ 'director.name': req.params.name })
		.then((movie) => {
			res.status(201).json(movie.director);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

//Add a user
app.post(
	'/users',
	[
		check('username', 'Username is required').isLength({ min: 5 }),
		check('username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
		check('password', 'Password is required').not().isEmpty(),
		check('email', 'Email does not appear to be valid').isEmail(),
	],
	async (req, res) => {
		let errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		try {
			let hashedPassword = await bcrypt.hash(req.body.password, 10);
			let user = await Users.findOne({ username: req.body.username });
			if (user) {
				return res.status(400).send(`${req.body.username} already exists`);
			} else {
				user = await Users.create({
					username: req.body.username,
					password: hashedPassword,
					email: req.body.email,
					birthday: req.body.birthday,
				});

				// Generate a JWT token
				const payload = { user: { id: user._id } };
				const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Use an environment variable for the secret

				res.status(201).json({ user, token }); // Send back both the user object and the token
			}
		} catch (error) {
			console.error(error);
			res.status(500).send('Server error');
		}
	}
);
// #6 Update a user's info by username
app.put('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	if (req.user.username !== req.params.username) {
		return res.status(400).send('Permission denied');
	}
	await Users.findOneAndUpdate(
		{ username: req.params.username },
		{
			$set: {
				username: req.body.username,
				password: req.body.password,
				email: req.body.email,
				birthday: req.body.birthday,
			},
		},
		{ new: true }
	)
		.then((updatedUser) => {
			res.json(updatedUser);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// Add a movie to a user's list of favorites
app.post('/users/:username/movies/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Users.findOneAndUpdate(
		{ username: req.params.username },
		{
			$push: { favoriteMovies: req.params.movieID },
		},
		{ new: true }
	) // This line makes sure that the updated document is returned
		.then((updatedUser) => {
			res.json(updatedUser);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// Remove a movie from a user's list of favorites
app.delete('/users/:username/movies/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Users.findOneAndUpdate(
		{ username: req.params.username },
		{
			$pull: { favoriteMovies: req.params.movieID },
		},
		{ new: true }
	) // This line makes sure that the updated document is returned
		.then((updatedUser) => {
			res.json(updatedUser);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// Delete a user by username
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	console.log('Attempting to delete user:', req.params.username); // Debugging line
	try {
		const user = await Users.findOneAndRemove({ username: req.params.username });
		if (!user) {
			return res.status(404).send('User not found');
		}
		res.status(200).send('User deleted successfully');
	} catch (err) {
		console.error('Error during deletion:', err); // More detailed error logging
		res.status(500).send('Server error');
	}
});

require('./auth')(router);

app.use('/', router);

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
	console.log('Listening on Port ' + port);
});

// MongoDB connection error handling
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
