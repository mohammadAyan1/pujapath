// import client from "prom-client";

// const collectDefaultMetrics = client.collectDefaultMetrics;

// collectDefaultMetrics();

// export const register = client.register;

// // Total API Requests
// export const httpRequestsTotal = new client.Counter({
//     name: "http_requests_total",
//     help: "Total number of HTTP requests",
//     labelNames: ["method", "route", "status"],
// });


import client from "prom-client";

export const loginCounter = new client.Counter({
    name: "login_requests_total",
    help: "Total Login Requests",
});

export const registerCounter = new client.Counter({
    name: "register_requests_total",
    help: "Total Register Requests",
});

export const bookingCounter = new client.Counter({
    name: "booking_created_total",
    help: "Total Bookings Created",
});

export const redisHitCounter = new client.Counter({
    name: "redis_hits_total",
    help: "Redis Cache Hits",
});

export const redisMissCounter = new client.Counter({
    name: "redis_miss_total",
    help: "Redis Cache Misses",
});


export const httpDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP Request Duration",
    labelNames: ["method", "route", "status"],
    buckets: [0.1, 0.3, 0.5, 1, 2, 5]
});


export const errorCounter = new client.Counter({
    name: "http_errors_total",
    help: "Total HTTP Errors",
    labelNames: ["status"],
});

export const register = client.register;