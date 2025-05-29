import path from "path";
import dotenv from "dotenv";
import fs from "fs";

/**
 * @summary loadEnv
 * @description Loads environment variables from a .env file based on the current NODE_ENV.
 * The .env file is expected to be located in the root directory of the project.
 * If NODE_ENV is not set, it defaults to "dev_local", which will load the .env.dev_local file.
 *
 */
const loadEnv = () => {
  const env = process.env.NODE_ENV || "dev_local";
  const envFile = `.env.${env}`;
  const fullPath = path.resolve(__dirname, `../../${envFile}`);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath });
    console.log(`Loaded env from ${envFile}`);
  } else {
    console.error(`Warning: ${envFile} not found.`);
  }
};

export default loadEnv;
