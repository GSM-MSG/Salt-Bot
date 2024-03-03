import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces/Command";
import { scheduleRepository } from "../repositories/ScheduleRepository";

export default {
  data: new SlashCommandBuilder()
    .setName("delete-schedule")
    .setDescription("스케쥴링된 일정을 삭제해요!")
    .addStringOption((optionBuilder) =>
      optionBuilder
        .setName("schedule-id")
        .setDescription("일정의 ID를 입력해주세요!")
        .setMinLength(20)
        .setMaxLength(20)
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const scheduleID = interaction.options.getString("schedule-id");
    if (!scheduleID) throw new Error("일정 ID가 입력되지 않았어요!");

    await scheduleRepository.deleteSchedule(scheduleID);
    await interaction.reply({
      content: "✅ 성공적으로 일정을 삭제했어요!"
    });
  }
} as Command;
