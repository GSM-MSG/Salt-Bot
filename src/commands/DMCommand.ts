import { ChatInputCommandInteraction, Collection, Message, SlashCommandBuilder } from "discord.js";
import { client } from "../discordClient";
import { Command } from "../interfaces/Command";

export default {
  data: new SlashCommandBuilder()
    .setName("dm")
    .setDescription("MSG 서버에 있는 멤버들에게 DM을 대신 보내줘요!"),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      content:
        "DM을 보낼 멤버들의 디스코드 ID들을 입력해주세요\n(e.g. 'baekteun,2ishwa,junseopark,seojumee')"
    });
    const memberIDsMessage = await interaction.channel?.awaitMessages({
      max: 1,
      time: 30_000,
      filter: (msg) => msg.author.id == interaction.user.id,
      errors: ["time"]
    });
    if (!memberIDsMessage) return;

    const memberIDsFirstMessage = memberIDsMessage.first();
    if (!memberIDsFirstMessage) return;

    const memberIds = await getMemberIDs(memberIDsFirstMessage);

    await memberIDsFirstMessage.reply({
      content: "DM 내용을 입력해주세요!"
    });

    const dmContentMessage = await interaction.channel?.awaitMessages({
      max: 1,
      time: 30_000,
      filter: (msg) => msg.author.id == interaction.user.id,
      errors: ["time"]
    });
    if (!dmContentMessage) return;

    const dmContentFirstMessage = dmContentMessage.first();
    if (!dmContentFirstMessage) return;

    const dmContent = dmContentFirstMessage.content;

    memberIds.forEach(async (memberID) => {
      const user = await client.users.fetch(memberID);
      await user.send({
        content: dmContent
      });
    });

    await interaction.channel?.send({
      content: "DM을 성공적으로 전송했어요!"
    });

    async function getMemberIDs(memberIDsReply: Message<boolean>): Promise<string[]> {
      const members = await interaction.guild?.members.fetch();
      if (!members) return [];
      const memberIDs = memberIDsReply.content.split(",");
      console.log(members.map((m) => m.user.username));
      const memIDs = members
        .filter((member) => memberIDs.includes(member.user.username))
        .map((m) => m.user.id);
      return memIDs;
    }
  }
} as Command;
