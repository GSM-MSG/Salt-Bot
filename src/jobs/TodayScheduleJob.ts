import { Client, EmbedBuilder, TextChannel } from "discord.js";
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

      const channel: TextChannel = (await this.client.channels.fetch(
        schedule.channelID
      )) as TextChannel;
      await channel.send({
        content: `## 📅 오늘 \`${schedule.title}\` 일정이 있어요! 다들 준비해주세요!\n\n새로운 스케쥴은 \`/add-schedule\`로 생성할 수 있어요!`
      });

      for (const userID of schedule.userIDs) {
        const member = await guild.members.fetch(userID);
        if (member.user.bot) continue;

        const embed = new EmbedBuilder()
          .setColor(0x8cf1ff)
          .setTitle(`${schedule.hour}시 ${schedule.minute}분 - ${schedule.title}`)
          .setDescription(schedule.content);

        await member.user.send({
          content: "오늘 일정을 보내드려요, 꼭 잊지말고 참여해주세요!",
          embeds: [embed]
        });
      }
    }
  }
}
