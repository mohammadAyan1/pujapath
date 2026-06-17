import logger from "../utils/logger.js";

export const errorHandler = (
    err,
    req,
    res,
    next
) => {

    logger.error({
        url: req.originalUrl,
        method: req.method,
        message: err.message,
        stack: err.stack,
    });

    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
};