const bcrypt = require('bcrypt');
const User = require('../models/User');
const auth = require('../auth');

module.exports.registerUser = (req, res) => {
    if (!req.body.email.includes('@')) {
        return res.status(400).send({ message: 'Invalid email format' });
    } 
    else if (req.body.password.length < 8) {
        return res.status(400).send({ message: 'Password must be at least 8 characters' });
    }

    User.findOne({ $or: [{ email: req.body.email }, { username: req.body.username }] })
    .then(existingUser => {
        if (existingUser) {
            const field = existingUser.email === req.body.email ? 'Email' : 'Username';
            return res.status(400).send({ message: `${field} already exists` });
        }

        const newUser = new User({
            email: req.body.email,
            username: req.body.username,
            password: bcrypt.hashSync(req.body.password, 10)
        });

        return newUser.save()
        .then(user => {
            res.status(201).send({
                message: 'Successfully Registered',
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username
                }
            });
        });
    })
    .catch(err => auth.errorHandler(err, req, res));
};

module.exports.loginUser = (req, res) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }

            const isPasswordCorrect = bcrypt.compareSync(req.body.password, user.password);

            if (!isPasswordCorrect) {
                return res.status(401).send({ message: 'Incorrect password' });
            }

            res.status(200).send({
                accessToken: auth.createAccessToken(user),
                user: {
                    id: user._id,
                    email: user.email,
                    isAdmin: user.isAdmin
                }
            });
        })
        .catch(err => auth.errorHandler(err, req, res));
};

module.exports.getProfile = (req, res) => {
    return User.findById(req.user.id)
        .select('-password')
        .then(user => {
            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }
            res.status(200).send(user);
        })
        .catch(error => auth.errorHandler(error, req, res));
};

module.exports.getAllUsers = (req, res) => {
    User.find()
        .select('-password')
        .then(users => {
            res.status(200).json(users);
        })
        .catch(error => auth.errorHandler(error, req, res));
};
