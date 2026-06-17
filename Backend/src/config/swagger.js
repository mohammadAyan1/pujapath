import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "PujaPath API",
            version: "1.0.0",
            description: "PujaPath Backend API Documentation",
        },

        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
    },

    apis: [
        "./src/routes/*.js",
    ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;