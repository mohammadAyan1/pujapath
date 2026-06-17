import client from "prom-client";

const collectDefaultMetrics =
    client.collectDefaultMetrics;

collectDefaultMetrics();

export const register = client.register;