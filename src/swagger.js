import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Youtube API's",
    description: "Description",
  },
  host: "localhost:8000",
  schemes: ["http"],
};

const outputFile = "./src/swagger-output.json";
const routes = ["./src/routes/user.routes.js"];

swaggerAutogen()(outputFile, routes, doc);
