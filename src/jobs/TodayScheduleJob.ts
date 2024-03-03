import { Client, EmbedBuilder } from "discord.js";
import { Job } from "../interfaces/Job";
import { scheduleRepository } from "../repositories/ScheduleRepository";
import { DateTime } from "luxon";

export class TodayScheduleJob extends Job {
  name = "today-schedule-list-job";
  schedule = "0 8 * * *";

  constructor(private readonly client: Client) {
    super();
  }

  async run(): Promise<void> {
    const currentDate = DateTime.now().setZone("Asia/Seoul");
    const todaySchedules = await scheduleRepository.getSchedules((schedule) => {
      return (
        schedule.year === currentDate.year &&
        schedule.month == currentDate.month &&
        schedule.day == currentDate.day
      );
    });
    for (const schedule of todaySchedules) {
      const guild = await this.client.guilds.fetch(schedule.guildID);

      for (const userID of schedule.userIDs) {
        const member = await guild.members.fetch(userID);
        if (member.user.bot) continue;

        const embed = new EmbedBuilder()
          .setColor(0x8cf1ff)
          .setTitle(`${schedule.hour}시 ${schedule.minute}분 - ${schedule.title}`)
          .setDescription(schedule.content);

        await member.user.send({
          content: "오늘 일정을 보내드려요!",
          embeds: [embed]
        });
      }
    }
  }
}
