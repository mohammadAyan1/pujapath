import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,

    handler: (req, res) => {
        return res.status(429).json({
            success: false,
            message:
                "Too many requests. Please wait before trying again.",
            retryAfter: "15 minutes",
        });
    },
});