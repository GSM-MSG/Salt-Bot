import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces/Command";
import { scheduleRepository } from "../repositories/ScheduleRepository";
import { FormatUtils } from "../utils/FormatUtils";

export default {
  data: new SlashCommandBuilder()
    .setName("list-schedule")
    .setDescription("저장된 일정들의 리스트를 알려드려요!"),
  async execute(interaction: ChatInputCommandInteraction) {
    const scheduleListMessage = await interaction.reply({
      content: "스레드에서 일정 리스트를 알려드릴게요!"
    });
    const thread = await (
      await scheduleListMessage.fetch()
    ).startThread({
      name: "일정 리스트"
    });
    await thread.send({
      content: FormatUtils.userMention(interaction.user.id)
    });

    const allSchedules = await scheduleRepository.getAllSchedules();
    const embeds = allSchedules.map((schedule) => {
      const scheduleDateString = `${schedule.year}년 ${schedule.month}월 ${schedule.day}일 ${schedule.hour}시 ${schedule.minute}분`;
      const embed = new EmbedBuilder()
        .setTitle(`${schedule.title} - \`${schedule.id}\``)
        .setDescription(
          `
일정 이름 - ${schedule.title}
일정 내용 - ${schedule.content}
일정 알림 채널 - ${FormatUtils.channelMention(schedule.channelID)}
일정 반복 기간 - ${schedule.isRepeat ? schedule.repeatPattern : "반복하지 않음"}
리마인더 활성화 - ${schedule.isOnReminder}
스케쥴링된 날짜 - ${scheduleDateString}
        `
        )
        .setTimestamp()
        .setColor(0x5aa363);
      return embed;
    });
    if (embeds.length > 0) {
      await thread.send({
        embeds: embeds
      });
    } else {
      await thread.send({
        content: "등록된 일정이 없어요!"
      });
    }
    await thread.setArchived(true);
  }
} as Command;
