const jwt = require('jsonwebtoken');
const JWT_SECRET_KEY = "blogApp";

// Generating a token
module.exports.createAccessToken = (user) => {
    const data = {
        id: user._id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin
    }
    return jwt.sign(data, JWT_SECRET_KEY, {});
}

// Verify token middleware (you might want to add this if it's missing)
module.exports.verify = (req, res, next) => {
    let token = req.headers.authorization;
    
    if (!token) {
        return res.status(401).send({ auth: "Failed", message: "No token provided" });
    }

    token = token.split(' ')[1]; // Remove "Bearer " prefix if present

    jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ auth: "Failed", message: "Failed to authenticate token" });
        }
        
        req.user = decoded;
        next();
    });
};

// Verify Admin - checks database
module.exports.verifyAdmin = (req, res, next) => {
    if(req.user.isAdmin) {
        next();
    } else {
        return res.status(403).send({
            auth: "Failed",
            message: "Action Forbidden"
        })
    }
}

// Error Handler
module.exports.errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500
    const errorMessage = err.message || 'Internal Server Error'

    res.status(statusCode).json({
        error: {
            message: errorMessage,
            errorCode: err.code || 'SERVER_ERROR',
            details: err.details
        }
    })
}