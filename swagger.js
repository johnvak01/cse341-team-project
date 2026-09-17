import { writeFileSync } from "node:fs";
import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Books API",
            version: "1.0.0",
            description: "A simple API for working with books",
        },
        servers: [
            {
                url: "/api/",
                description: "Current server",
            },
        ],
    },
    apis: ["./src/routes/api-routes.js", "./app.js"],
};

const swaggerSpec = swaggerJsdoc(options);

writeFileSync("./swagger.json", JSON.stringify(swaggerSpec, null, 2));
console.log("Swagger documentation generated.");
