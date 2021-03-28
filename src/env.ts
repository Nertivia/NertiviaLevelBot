import * as dotenv from "dotenv";

const result = dotenv.config();

if (result.error) {
  throw result.error;
}

if (!process.env["TOKEN"]) {
  throw new Error("No token was specified");
}