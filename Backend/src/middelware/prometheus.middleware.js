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
import { errorCounter } from "../monitoring/metrics.js";

export const responseTimeMiddleware = (req, res, next) => {

    const start = Date.now();

    res.on("finish", () => {


        console.log("STATUS =>", res.statusCode);

        if (res.statusCode >= 400) {
            console.log("ERROR COUNTED");

            errorCounter
                .labels(String(res.statusCode))
                .inc();
        }


        const duration =
            (Date.now() - start) / 1000;

        httpDuration
            .labels(
                req.method,
                req.route?.path || req.path,
                res.statusCode
            )
            .observe(duration);

        // Error Counter
        if (res.statusCode >= 400) {
            errorCounter
                .labels(res.statusCode)
                .inc();
        }
    });

    next();
};