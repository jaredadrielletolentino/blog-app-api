const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is Required'],
        unique: true
    },
    username: {
        type: String,
        required: [true, 'Username is Required'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password is Required']
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);