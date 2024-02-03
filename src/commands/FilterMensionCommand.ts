import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces/Command";

export default {
  data: new SlashCommandBuilder()
    .setName("mention")
    .setDescription("역할을 필터링해서 맨션합니다.")
    .addRoleOption((role: any) =>
      role.setName('a').setDescription('필터링할 역할을 선택합니다.').setRequired(true)
    )
    .addRoleOption((role: any) =>
      role.setName('b').setDescription('필터링할 역할을 선택합니다.').setRequired(false)
    )
    .addRoleOption((role: any) =>
      role.setName('c').setDescription('필터링할 역할을 선택합니다.').setRequired(false)
    ),


  async execute(interaction: ChatInputCommandInteraction) {
    const firstRole = interaction.options.getRole('a')?.id ?? ''
    const secondRole = interaction.options.getRole('b')?.id ?? ''
    const thirdRole = interaction.options.getRole('c')?.id ?? ''

    const roleMembers = interaction.guild?.roles.cache.get(firstRole)?.members

    const filteredMembers = roleMembers?.filter(member =>
      member.roles.cache.has(secondRole) && member.roles.cache.has(thirdRole)
    )
    
    const mentionedMembers = filteredMembers?.map(member => member.toString()).join(' ');

    await interaction.reply({
      content: `${mentionedMembers}`
    });
  }
} as Command;
