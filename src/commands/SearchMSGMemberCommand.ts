import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  SlashCommandBuilder
} from "discord.js";
import { Command } from "src/interfaces/Command";

export default {
  data: new SlashCommandBuilder()
    .setName("members")
    .setDescription("MSG에 있는 팀원들의 유저 정보를 가져와요!")
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("특정 Role을 가진 팀원들의 유저정보만 가져올 수 있어요.")
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    const roleOption = interaction.options.getRole("role");
    try {
      let members: GuildMember[];
      if (roleOption) {
        const allMembers = await interaction.guild.members.fetch();
        members = Array.from(
          allMembers.filter((user) => {
            return user.roles.cache.has(roleOption.id);
          })
        ).map((u) => u[1]);
      } else {
        members = Array.from(await interaction.guild.members.fetch()).map((u) => u[1]);
      }
      members = members.filter((m) => !m.user.bot);

      const prevID = "PREV";
      const prevButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Prev")
        .setEmoji("⬅️")
        .setCustomId(prevID);

      const nextID = "NEXT";
      const nextButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Next")
        .setEmoji("➡️")
        .setCustomId(nextID);

      const generateEmbed: (index: number) => EmbedBuilder = (index) => {
        const current = members.slice(index, index + 10);
        return new EmbedBuilder()
          .setTitle(`유저 정보 Page ${index / 10 + 1}`)
          .setDescription("MSG 팀원들의 role, username을 알려줘요")
          .setColor(0x70a1cd)
          .setTimestamp()
          .setFields(
            current.map((member) => {
              return {
                name: member.user.displayName,
                value: `
        username: ${member.user.username}
        roles: ${member.roles.cache.map((r) => r.name).join(", ")}
                  `
              };
            })
          );
      };

      const canFitOnOnePage = members.length <= 10;
      const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder({
        components: canFitOnOnePage ? [] : [nextButton]
      });

      const embedMessage = await interaction.reply({
        content: `usernames: ${members.map((u) => `\`${u.user.username}\``).join(", ")}`,
        embeds: [generateEmbed(0)],
        components: [row]
      });
      if (canFitOnOnePage) return;

      const collector = embedMessage.createMessageComponentCollector({
        filter: ({ user }) => user.id === interaction.user.id
      });
      let currentIndex = 0;
      collector.on("collect", async (collectInteraction) => {
        collectInteraction.customId === prevID ? (currentIndex -= 10) : (currentIndex += 10);
        await collectInteraction.update({
          content: `usernames: ${members.map((u) => `\`${u.user.username}\``).join(", ")}`,
          embeds: [generateEmbed(currentIndex)],
          components: [
            new ActionRowBuilder<ButtonBuilder>({
              components: [
                ...(currentIndex ? [prevButton] : []),
                ...(currentIndex + 10 < members.length ? [nextButton] : [])
              ]
            })
          ]
        });
      });
    } catch (error) {
      await interaction.reply({
        content: `${error}`
      });
    }
  }
} as Command;
