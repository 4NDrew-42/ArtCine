const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
	favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
});

// Hash the password
userSchema.statics.hashPassword = function (password) {
	return bcrypt.hashSync(password, 10);
};

// Validate the password
userSchema.methods.validatePassword = function (password) {
	return bcrypt.compareSync(password, this.password);
};

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
