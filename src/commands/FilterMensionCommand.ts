import { ChatInputCommandInteraction, GuildMember, Role, SlashCommandBuilder } from "discord.js";
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
    const firstRole = interaction.options.getRole('a') as Role
    const secondRole = interaction.options.getRole('b') as Role
    const thirdRole = interaction.options.getRole('c') as Role

    const members = await interaction.guild?.members;
    
    const roleMembers = await members?.fetch().then((members) =>
      members.filter((member) =>
        member.roles.cache.has(firstRole.id) &&
        (!secondRole || member.roles.cache.has(secondRole.id)) &&
        (!thirdRole || member.roles.cache.has(thirdRole.id))
      )
    )

    if(!roleMembers) return;

    await interaction.reply({
      content: `${roleMembers?.map((member: GuildMember) => member.toString()).join(' ')}`,
    });
  }
} as Command;