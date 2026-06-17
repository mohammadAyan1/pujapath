import client from "prom-client";

const collectDefaultMetrics = client.collectDefaultMetrics;

collectDefaultMetrics();

export const register = client.register;

// Total API Requests
export const httpRequestsTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status"],
});