const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

let movieSchema = mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String, required: true },
	genre: {
		name: String,
		description: String,
	},
	director: {
		name: String,
		bio: String,
		birth: Date,
		death: Date,
	},
	actors: [String],
	imagePath: String,
	featured: Boolean,
});

let userSchema = mongoose.Schema({
	username: { type: String, required: true },
	password: { type: String, required: true },
	email: { type: String, required: true },
	birth: Date,
	favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
});

userSchema.statics.hashPassword = (password) => {
	return bcryptjs.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
	return bcryptjs.compareSync(password, this.password);
};

let Movie = mongoose.model("Movie", movieSchema);
let User = mongoose.model("User", userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
