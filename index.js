const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const uuid = require("uuid");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect("mongodb://localhost:27017/ACDB", { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), { flags: "a" });

const movieDataJSON = [
	{
		title: "Inception",
		description: "A thief enters the dreams of others to steal secrets.",
		genre: "Science Fiction",
		director: "Christopher Nolan",
		actors: ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
		imageURL: "http://example.com/inception.jpg",
		favorited: false,
	},
	{
		title: "The Dark Knight",
		description: "Batman faces the Joker, a criminal mastermind.",
		genre: "Action",
		director: "Christopher Nolan",
		actors: ["Christian Bale", "Heath Ledger"],
		imageURL: "http://example.com/dark_knight.jpg",
		favorited: true,
	},
	{
		title: "Forrest Gump",
		description: "A man with a low IQ influences various historical events in the 20th century USA.",
		genre: "Drama",
		director: "Robert Zemeckis",
		actors: ["Tom Hanks"],
		imageURL: "http://example.com/forrest_gump.jpg",
		favorited: false,
	},
	{
		title: "Avatar",
		description: "A paraplegic Marine is sent to the moon Pandora on a unique mission.",
		genre: "Science Fiction",
		director: "James Cameron",
		actors: ["Sam Worthington", "Zoe Saldana"],
		imageURL: "http://example.com/avatar.jpg",
		favorited: false,
	},
	{
		title: "Titanic",
		description: "A romance blooms on the ill-fated R.M.S. Titanic.",
		genre: "Romance",
		director: "James Cameron",
		actors: ["Leonardo DiCaprio", "Kate Winslet"],
		imageURL: "http://example.com/titanic.jpg",
		favorited: true,
	},
	{
		title: "The Godfather",
		description: "The aging patriarch of an organized crime dynasty transfers control of his empire to his reluctant son.",
		genre: "Crime",
		director: "Francis Ford Coppola",
		actors: ["Marlon Brando", "Al Pacino"],
		imageURL: "http://example.com/godfather.jpg",
		favorited: false,
	},
	{
		title: "Jurassic Park",
		description: "A theme park with genetically-engineered dinosaurs turns into a nightmare.",
		genre: "Science Fiction",
		director: "Steven Spielberg",
		actors: ["Sam Neill", "Laura Dern"],
		imageURL: "http://example.com/jurassic_park.jpg",
		favorited: true,
	},
	{
		title: "Star Wars: A New Hope",
		description: "Luke Skywalker joins forces to defeat the Galactic Empire.",
		genre: "Science Fiction",
		director: "George Lucas",
		actors: ["Mark Hamill", "Harrison Ford"],
		imageURL: "http://example.com/star_wars.jpg",
		favorited: false,
	},
	{
		title: "The Shawshank Redemption",
		description: "Two imprisoned men bond over the years, finding solace and redemption.",
		genre: "Drama",
		director: "Frank Darabont",
		actors: ["Tim Robbins", "Morgan Freeman"],
		imageURL: "http://example.com/shawshank.jpg",
		favorited: true,
	},
	{
		title: "The Matrix",
		description: "A computer hacker discovers a simulated reality controlled by machines.",
		genre: "Science Fiction",
		director: "The Wachowskis",
		actors: ["Keanu Reeves", "Laurence Fishburne"],
		imageURL: "http://example.com/matrix.jpg",
		favorited: false,
	},
];

const userDataJSON = [
	{
		username: "user1",
		password: "password1",
		email: "1@a.net",
		favorites: ["The Dark Knight", "Titanic"],
	},
	{
		username: "user2",
		password: "password2",
		email: "2@a.net",
		favorites: ["The Shawshank Redemption", "The Dark Knight"],
	},
];

const movieData = JSON.parse(JSON.stringify(movieDataJSON));

const userData = JSON.parse(JSON.stringify(userDataJSON));

app.use(express.static("public"));

// Combines logging info from request and response
app.use(morgan("combined", { stream: accessLogStream }));
app.use(morgan("common"));

app.use(bodyParser.json());

app.get("/documentation", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "documentation.html"));
});

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/secreturl", (req, res) => {
	res.send("This is a secret url with super top-secret content.");
});

app.get("/movies", (req, res) => {
	res.json(movieData);
});

// Get all users
app.get("/users", async (req, res) => {
	await Users.find()
		.then((users) => {
			res.status(201).json(users);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send("Error: " + err);
		});
});

app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);

app.use(bodyParser.json());
app.use(methodOverride());

// #1 JSON data for movies
app.get("/movies", (req, res) => {
	res.send("Successful GET request returning data on all the movies");
});

// #2 JSON data for a single movie by title
app.get("/movies/:title", (req, res) => {
	res.send("Successful GET request returning data on a single movie");
});

// #3 JSON data for a genre by name
app.get("/movies/genre/:name", (req, res) => {
	res.send("Successful GET request returning data on a genre by name");
});

// #4 JSON data for a director by name
app.get("/movies/director/:name", (req, res) => {
	res.send("Successful GET request returning data on a director by name");
});

//Add a user
/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
app.post("/users", async (req, res) => {
	await Users.findOne({ Username: req.body.Username })
		.then((user) => {
			if (user) {
				return res.status(400).send(req.body.Username + "already exists");
			} else {
				Users.create({
					Username: req.body.Username,
					Password: req.body.Password,
					Email: req.body.Email,
					Birthday: req.body.Birthday,
				})
					.then((user) => {
						res.status(201).json(user);
					})
					.catch((error) => {
						console.error(error);
						res.status(500).send("Error: " + error);
					});
			}
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send("Error: " + error);
		});
});

// #6 Update a user's info by username
app.put("/users/:username", (req, res) => {
	res.send("Successful PUT request updating a user's info by username");
});

// #7 Add a movie to a user's list of favorites
app.post("/users/:username/favorites", (req, res) => {
	res.send("Successful POST request adding a movie to a user's list of favorites");
});

// #8 Remove a movie from a user's list of favorites
app.delete("/users/:username/favorites/:title", (req, res) => {
	res.send("Successful DELETE request removing a movie from a user's list of favorites");
});

// #9 Delete a user by username
app.delete("/users/:username", (req, res) => {
	res.send("Successful DELETE request deleting a user by username");
});

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send("Something broke!");
});

app.listen(8080, () => {
	console.log("Your app is listening on port 8080.");
});
