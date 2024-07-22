import express from "express";
import schedule from "node-schedule";
import { loginDiscord } from "./discord.js";
import { checkDate } from "./scheduler.js";

const app = express();
const port = 8080;
const host = "0.0.0.0";

async function main() {
  app.get("/", (req, res) => {
    res.send("I'm alive!!");
  });
  app.listen(port, host, () => {
    console.log(`Server is running at http://${host}:${port}`);
  });

  loginDiscord()
    .then(() => checkDate())
    .catch((err) => console.error(`Error occurred: ${err}`));

  // check for posts every day at midnight
  schedule.scheduleJob("0 0 * * *", () => {
    console.log("checking scheduled posts...");
    checkDate();
  });
}

main();
