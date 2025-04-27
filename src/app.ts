/**
 * @File app.ts
 * This is the main entry point of the application,
 * which defines the processing pipeline of the web server.
 *
 * 1. loads env.
 * 2. initializes express.
 * 3. loads pre-processing middlewares.
 *   - to parse json.
 *   - to parse urlencoded data.
 *   - to host static files.
 *   - ...
 * 4. loads route, which is the main logic of the pipeline.
 * 5. loads post-processing middlewares.
 *   - error handler.
 * 6. starts the server and listens on the specified port.
 */

import express from "express";
import dotenv from "dotenv";
import path from "path";
import routers from "./routes/router_index";
import errorHandler from "./middleware/error_handler";

// Import env
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: path.resolve(__dirname, `../${envFile}`) });

// Init express
const app = express();

// - Pre-processing middlewares

// to parse json
app.use(express.json());
// to parse urlencoded data
app.use(express.urlencoded({ extended: true }));
// to host static files
app.use(express.static(path.join(__dirname, "../public")));
// todo: add more middlewares



// The routers, as well as the main logic of the pipeline.
app.use("/", routers);



// - Post-processing middlewares

// In Express 5, all the errors are passed to here.
app.use(errorHandler);



// Start server
const PORT: number = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => {
  console.log(`Server is running at ${process.env.BASE_URL} port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
