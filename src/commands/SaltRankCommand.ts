import { ChatInputCommandInteraction, Embed, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces/Command";
import { saltRepository } from "../repositories/SaltRepository";

export default {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("지금까지 받은 소금을 기준으로 TOP 10을 보여드려요!"),
  async execute(interaction: ChatInputCommandInteraction) {
    let receivedSaltRankList = await saltRepository.getReceivedSaltRankList();
    let result = "";
    receivedSaltRankList.sort((lhs, rhs) => rhs.count - lhs.count);
    receivedSaltRankList = receivedSaltRankList.slice(0, 10);
    receivedSaltRankList.forEach((salt, index) => {
      if (index == 0) {
        result = result.concat(`1️⃣등 **${salt.username}**\n${salt.count} 소금`);
      } else if (index == 1) {
        result = result.concat(`2️⃣등 **${salt.username}**\n${salt.count} 소금`);
      } else if (index == 2) {
        result = result.concat(`3️⃣등 **${salt.username}**\n${salt.count} 소금`);
      } else {
        result = result.concat(`${index + 1}등 ${salt.username}\n${salt.count} 소금`);
      }
      result = result.concat("\n\n");
    });
    const embed = new EmbedBuilder()
      .setTitle("소금 TOP 10!")
      .setColor(0x70a1cd)
      .setDescription(result);
    await interaction.reply({
      embeds: [embed]
    });
  }
} as Command;
