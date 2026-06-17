import { httpRequestsTotal } from "../monitoring/metrics.js";

export const prometheusMiddleware = (req, res, next) => {

    res.on("finish", () => {

        httpRequestsTotal.inc({
            method: req.method,
            route: req.route?.path || req.path,
            status: res.statusCode,
        });

    });

    next();
};