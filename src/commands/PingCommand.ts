import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "src/interfaces/Command";

export default {
  data: new SlashCommandBuilder().setName("summon").setDescription("소금이 생존 신고용이에요!"),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      content: "πø˜©!",
      ephemeral: false
    });
  }
} as Command;
