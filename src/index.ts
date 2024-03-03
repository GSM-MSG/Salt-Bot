import { MSGSaltBot } from "./MSGSaltBot";
import express, { Express } from "express";
import { client } from "./discordClient";
import { JobService } from "./services/JobService";
import { Job } from "./interfaces/Job";
import { ReminderSchedulerJob } from "./jobs/ReminderSchedulerJob";
import { scheduleRepository } from "./repositories/ScheduleRepository";
import { SchedulerJob } from "./jobs/SchedulerJob";
import { TodayScheduleJob } from "./jobs/TodayScheduleJob";

scheduleRepository.syncRemote();

const jobs: Job[] = [
  new ReminderSchedulerJob(client),
  new SchedulerJob(client),
  new TodayScheduleJob(client)
];

const jobService = new JobService(jobs);

export const bot = new MSGSaltBot(client, jobService);

const app: Express = express();
const port = 3004;

app.listen(port, () => {
  console.log(`Listening at ${port}`);
});
