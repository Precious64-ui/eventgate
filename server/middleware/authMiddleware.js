const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        // Get token from request headers
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Not authorized. No token provided."
            });
        }

        // Get the actual token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, "mysecretkey");

        // Add user information to request
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Not authorized. Invalid token."
        });
    }
};

module.exports = protect;