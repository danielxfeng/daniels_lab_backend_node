import path from "path";
import dotenv from "dotenv";
import fs from "fs";

const loadEnv = () => {
  const env = process.env.NODE_ENV || "development";
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
