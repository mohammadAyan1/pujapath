// import { httpRequestsTotal } from "../monitoring/metrics.js";

// export const prometheusMiddleware = (req, res, next) => {

//     res.on("finish", () => {

//         httpRequestsTotal.inc({
//             method: req.method,
//             route: req.route?.path || req.path,
//             status: res.statusCode,
//         });

//     });

//     next();
// };


import { httpDuration } from "../monitoring/metrics.js";

export const responseTimeMiddleware =
    (req, res, next) => {

        const start = Date.now();

        res.on("finish", () => {

            const duration =
                (Date.now() - start) / 1000;

            httpDuration
                .labels(
                    req.method,
                    req.route?.path || req.path,
                    res.statusCode
                )
                .observe(duration);
        });

        next();
    };