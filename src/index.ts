import { MSGSaltBot } from "./MSGSaltBot";
import express, { Express } from "express";
import { client } from "./discordClient";

export const bot = new MSGSaltBot(client);

const app: Express = express();
const port = 3004;

app.listen(port, () => {
  console.log(`Listening at ${port}`);
});
