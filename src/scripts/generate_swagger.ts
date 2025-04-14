import fs from "fs";
import path from "path";
import swaggerJsdoc from "swagger-jsdoc";

/**
 * Generate or update swagger.json from routes.
 */
const generateSwagger = () => {
  const __dirname = process.cwd();

  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Blog API",
        version: "1.0.0",
      },
    },
    apis: ["src/routes/**/*.ts"],
  };

  const swaggerSpec = swaggerJsdoc(options);
  const swaggerFilePath = path.resolve(__dirname, "swagger.json");

  const prev = fs.existsSync(swaggerFilePath)
    ? fs.readFileSync(swaggerFilePath, "utf8")
    : null;

  const curr = JSON.stringify(swaggerSpec, null, 2);

  if (prev !== curr) {
    fs.writeFileSync(swaggerFilePath, curr, "utf8");
    console.log("[Swagger] swagger.json updated.");
  } else {
    console.log("[Swagger] No change detected in swagger.json.");
  }
};

generateSwagger();
