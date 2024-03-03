import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces/Command";
import { scheduleRepository } from "../repositories/ScheduleRepository";

export default {
  data: new SlashCommandBuilder()
    .setName("sync-schedule")
    .setDescription("원격(현재 Firebase)에 저장된 Schedule과 소금이 봇의 Schedule을 동기화해요!"),
  async execute(interaction: ChatInputCommandInteraction) {
    await scheduleRepository.syncRemote()
    await interaction.reply({
      content: "✅ 동기화를 완료했어요!"
    })
  }
} as Command;
