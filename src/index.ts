import { MSGSaltBot } from "./MSGSaltBot";
import express, { Express } from "express";
import { client } from "./discordClient";
import { JobService } from "./services/JobService";
import { Job } from "./interfaces/Job";


const jobs: Job[] = [
];

const jobService = new JobService(jobs);

export const bot = new MSGSaltBot(client, jobService);

const app: Express = express();
const port = 3004;

app.listen(port, () => {
  console.log(`Listening at ${port}`);
});
