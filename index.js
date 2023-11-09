const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const uuid = require("uuid");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const Models = require("./models.js");

const app = express();

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect("mongodb://localhost:27017/ACDB", { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(express.static("public"));

const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), { flags: "a" });
app.use(morgan("combined", { stream: accessLogStream }));

app.get("/documentation", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "documentation.html"));
});

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ROUTING

// Get all users
app.get("/users", async (req, res) => {
	await Users.find()
		.then((users) => {
			res.status(200).json(users);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send("Error: " + err);
		});
});
// Get a user by username
app.get("/users/:username", async (req, res) => {
	try {
		const user = await Users.findOne({ username: req.params.username });
		if (!user) {
			return res.status(404).send("User not found");
		}
		res.status(200).json(user);
	} catch (err) {
		console.error(err);
		res.status(500).send("Error: " + err);
	}
});

// #1 JSON data for movies
app.get("/movies", async (req, res) => {
	await Movies.find()
		.then((movies) => {
			res.status(201).json(movies);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send("Error: " + err);
		});
});
// #2 JSON data for a single movie by title
app.get("/movies/:title", async (req, res) => {
	await Movies.findOne({ title: req.params.title })
		.then((movie) => {
			res.status(201).json(movie);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send("Error: " + err);
		});
});
// #3 JSON data for a genre by name
app.get("/movies/genre/:name", async (req, res) => {
	await Movies.findOne({ "genre.name": req.params.name })
		.then((movie) => {
			res.status(201).json(movie.genre);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send("Error: " + err);
		});
});
// #4 JSON data for a director by name
app.get("/movies/director/:name", async (req, res) => {
	await Movies.findOne({ "director.name": req.params.name })
		.then((movie) => {
			res.status(201).json(movie.director);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send("Error: " + err);
		});
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
	await Users.findOne({ username: req.body.username })
		.then((user) => {
			if (user) {
				return res.status(400).send(req.body.username + "already exists");
			} else {
				Users.create({
					username: req.body.username,
					password: req.body.password,
					email: req.body.email,
					birthday: req.body.birthday,
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
app.put("/users/:username", async (req, res) => {
	await Users.findOneAndUpdate({ username: req.params.username }, { $set: { ...req.body } }, { new: true })
		.then((updatedUser) => {
			res.json(updatedUser);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send("Error: " + err);
		});
});

// Add a movie to a user's list of favorites
app.post("/users/:username/movies/:movieID", async (req, res) => {
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
			res.status(500).send("Error: " + err);
		});
});

// Remove a movie from a user's list of favorites
app.delete("/users/:username/movies/:movieID", async (req, res) => {
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
			res.status(500).send("Error: " + err);
		});
});

// Delete a user by username
app.delete("/users/:username", async (req, res) => {
	console.log("Attempting to delete user:", req.params.username); // Debugging line
	try {
		const user = await Users.findOneAndRemove({ username: req.params.username });
		if (!user) {
			return res.status(404).send("User not found");
		}
		res.status(200).send("User deleted successfully");
	} catch (err) {
		console.error("Error during deletion:", err); // More detailed error logging
		res.status(500).send("Server error");
	}
});

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send("Something broke!");
});

app.listen(8080, () => {
	console.log("Your app is listening on port 8080.");
});

// MongoDB connection error handling
mongoose.connection.on("error", console.error.bind(console, "MongoDB connection error:"));
