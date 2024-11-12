import { createObjectCsvWriter } from "csv-writer";
import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  Message,
  SlashCommandBuilder,
  TextChannel
} from "discord.js";
import fs from "fs";
import path from "path";
import { Command } from "../interfaces/Command";

export default {
  data: new SlashCommandBuilder()
    .setName("chat-to-document")
    .setDescription("해당하는 채널을 문서화합니다."),
  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.channel as TextChannel;
    let messages = [];
    let lastMessageId = null;

    interaction.deferReply();

    while (true) {
      const fetchedMessages: any = await channel?.messages.fetch({
        limit: 100,
        before: lastMessageId
      });
      if (fetchedMessages.size === 0) break;

      messages.push(
        ...fetchedMessages.map((message: Message) => {
          return {
            date: message.createdAt,
            author: message.author.username,
            content: message.content,
            image: message
          };
        })
      );
      lastMessageId = fetchedMessages.last().id;
    }

    const filePath = path.join(__dirname, "messages.csv");
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: "date", title: "Date" },
        { id: "author", title: "Author" },
        { id: "content", title: "Content" }
      ],
      encoding: "utf8"
    });

    await csvWriter.writeRecords(messages);

    const file = new AttachmentBuilder(filePath);
    await interaction.editReply({
      content: `${channel.name} 채널의 채팅 기록입니다.`,
      files: [file]
    });

    fs.unlinkSync(filePath);
  }
} as Command;
