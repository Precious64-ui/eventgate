const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Not authorized. No token provided."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Normalise the id so req.user.id and req.user._id both work
        req.user = {
            id: decoded.id || decoded._id,
            role: decoded.role
        };

        if (!req.user.id) {
            return res.status(401).json({
                message: "Not authorized. Malformed token."
            });
        }

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Not authorized. Invalid token."
        });
    }
};

module.exports = protect;