import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces/Command";
import { saltRepository } from "../repositories/SaltRepository";

export default {
  data: new SlashCommandBuilder()
    .setName("my")
    .setDescription("지금까지 받은 소금의 개수를 알려드려요!"),
  async execute(interaction: ChatInputCommandInteraction) {
    const receivedSalt = await saltRepository.getReceivedSalt(interaction.user.id);
    await interaction.reply({
      content: `지금까지 소금을 ${receivedSalt.count}번 받았어요!`
    });
  }
} as Command;
