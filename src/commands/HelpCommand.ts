import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "src/interfaces/Command";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("소금이 봇 사용 설명서를 전달드려요!"),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle("소금이 사용 설명서")
      .setDescription("소금이 봇을 소개해요!")
      .setURL("https://www.notion.so/matsougeum/9092ac47f57a437b93d83ffdefa35cc2?pvs=4")
      .setColor(0x70a1cd);

    await interaction.reply({
      embeds: [embed]
    });
  }
} as Command;
