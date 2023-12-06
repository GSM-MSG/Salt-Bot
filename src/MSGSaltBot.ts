import { Client, Events, Interaction, Message, REST, Routes } from "discord.js";
import { config } from "./utils/config";
import PingCommand from "./commands/PingCommand";
import { Command } from "./interfaces/Command";
import { saltRepository } from "./repositories/SaltRepository";
import MySaltCommand from "./commands/MySaltCommand";
import SaltRankCommand from "./commands/SaltRankCommand";
import HelpCommand from "./commands/HelpCommand";

export class MSGSaltBot {
  private slashCommandMap = new Map<string, Command>();

  public constructor(private readonly client: Client) {
    this.client.login(config.discordToken);

    this.client.on("ready", () => {
      console.log(`${this.client.user?.username ?? ""} ready!`);

      this.registerSlashCommands();
    });

    this.client.on("warn", (info) => console.log(info));
    this.client.on("error", console.error);

    this.client.on("messageCreate", async (interaction) => {
      this.onMessageCreate(interaction);
    });

    this.onInteractionReceived();
  }

  private async registerSlashCommands() {
    const discordREST = new REST({ version: "10" }).setToken(config.discordToken);
    const slashCommands: Array<Command> = [
      PingCommand,
      HelpCommand,
      MySaltCommand,
      SaltRankCommand
    ];

    this.slashCommandMap = slashCommands.reduce((map, command) => {
      map.set(command.data.name, command);
      return map;
    }, new Map<string, Command>());

    await discordREST.put(Routes.applicationCommands(this.client.user?.id ?? ""), {
      body: slashCommands.map((command) => command.data.toJSON())
    });
  }

  private async onInteractionReceived() {
    this.client.on(Events.InteractionCreate, async (interaction: Interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.slashCommandMap.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error: any) {
        console.error(error);

        await interaction.reply({
          content: error.toString()
        });
      }
    });
  }

  private async onMessageCreate(interaction: Message<boolean>) {
    let saltCount = interaction.content.split("🧂").length - 1;
    if (saltCount == 0) return;

    const users = interaction.mentions.users.filter((user) => !user.bot);
    const user = users.at(0);
    const author = interaction.author;

    if (users.size != 1) return;
    if (!user) return;
    if (user.id == author.id) {
      interaction.reply({
        content: "자기자신에게는 소금을 뿌릴 수 없어요!"
      });
      return;
    }
    const maxSaltCount = 10;

    const usedSalt = await saltRepository.getUsedSalt(author.id);
    if (usedSalt >= 10) {
      interaction.reply({
        content: `
오늘 뿌릴 수 있는 소금을 모두 다 뿌렸어요!
내일 다시 뿌려보는거 어떤가요?
`
      });
      return;
    } else if (usedSalt + saltCount > maxSaltCount) {
      saltCount = maxSaltCount - usedSalt;
    }
    await saltRepository.updateUsedSalt(author.id, usedSalt + saltCount);

    const receivedSalt = await saltRepository.getReceivedSalt(user.id);
    await saltRepository.updateReceivedSalt(user.id, user.username, receivedSalt.count + saltCount);
    interaction.react("🧂");

    const remainSalt = maxSaltCount - usedSalt - saltCount;
    interaction.author.send({
      content: `
🧂 \`${user.displayName}\`님에게 소금을 ${saltCount} 스푼 뿌렸어요! 
- 남은 소금 ${remainSalt}

> ${author.displayName} :
> ${interaction.content}
`
    });

    user.send({
      content: `
🧂 \`${author.displayName}\`님에게 소금을 ${saltCount} 스푼 받았어요!
- 지금까지 받은 소금 ${receivedSalt.count + saltCount}

> ${author.displayName} :
> ${interaction.content}
`
    });
  }
}
