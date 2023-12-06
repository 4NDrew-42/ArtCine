const passport = require("passport"),
	LocalStrategy = require("passport-local").Strategy,
	Models = require("./models.js"),
	passportJWT = require("passport-jwt");

let Users = Models.User,
	JWTStrategy = passportJWT.Strategy,
	ExtractJWT = passportJWT.ExtractJwt;

passport.use(
	new LocalStrategy(
		{
			usernameField: "username",
			passwordField: "password",
		},
		async (username, password, callback) => {
			console.log(`${username} ${password}`);
			await Users.findOne({ username: username })
				.then((user) => {
					if (!user) {
						console.log("incorrect username");
						return callback(null, false, {
							message: "Incorrect username or password.",
						});
					}
					if (!user.validatePassword(password)) {
						console.log("incorrect password");
						return callback(null, false, {
							message: "Incorrect password.",
						});
					}
					console.log("finished");
					return callback(null, user);
				})
				.catch((err) => {
					if (err) {
						console.log(err);
						return callback(err);
					}
				});
		}
	)
);

passport.use(
	new JWTStrategy(
		{
			jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
			secretOrKey: "your_jwt_secret",
		},
		async (jwtPayload, callback) => {
			return await Users.findById(jwtPayload._id)
				.then((user) => {
					return callback(null, user);
				})
				.catch((err) => {
					return callback(err);
				});
		}
	)
);
