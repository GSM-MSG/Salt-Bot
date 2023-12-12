import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces/Command";
import { saltRepository } from "../repositories/SaltRepository";

export default {
  data: new SlashCommandBuilder()
    .setName("current")
    .setDescription("지금 남아있는 소금의 개수를 알려드려요!"),
  async execute(interaction: ChatInputCommandInteraction) {
    const currentSalt = await saltRepository.getUsedSalt(interaction.user.id)
    await interaction.reply({
      content: `오늘은 소금을 ${10 - currentSalt}번 더 쓸 수 있어요!`
    });
  }
} as Command;
