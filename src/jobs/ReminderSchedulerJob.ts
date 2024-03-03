import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  ModalBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import { Job } from "../interfaces/Job";
import { DateTime } from "luxon";
import { scheduleRepository } from "../repositories/ScheduleRepository";

export class ReminderSchedulerJob extends Job {
  name = "reminder-scheduler-job";
  schedule = "* * * * *";
  initialDelaySecond = 60 - DateTime.now().setZone("Asia/Seoul").second;

  constructor(private readonly client: Client) {
    super();
  }

  async run(): Promise<void> {
    const currentDate = DateTime.now().setZone("Asia/Seoul").plus({ minute: 15 });

    const schedules = await scheduleRepository.getSchedules((schedule) => {
      return (
        schedule.year === currentDate.year &&
        schedule.month === currentDate.month &&
        schedule.day === currentDate.day &&
        schedule.hour === currentDate.hour &&
        schedule.minute === currentDate.minute &&
        schedule.isOnReminder === true
      );
    });

    schedules.forEach(async (schedule) => {
      const channel: TextChannel = (await this.client.channels.fetch(
        schedule.channelID
      )) as TextChannel;
      const scheduleMessage = await channel.send({
        content: `\`${schedule.title}\` 일정이 15분 뒤에 시작해요!`
      });
      scheduleMessage.react("✅");
      const thread = await scheduleMessage.startThread({
        name: "일정 참여 여부 현황!"
      });

      const guild = await this.client.guilds.fetch(schedule.guildID);
      for (const userID of schedule.userIDs) {
        const member = await guild.members.fetch(userID);
        if (member.user.bot) continue;

        const goButton = new ButtonBuilder()
          .setCustomId(`go-${userID}`)
          .setLabel("참여할거에요!")
          .setEmoji("🙌")
          .setDisabled(false)
          .setStyle(ButtonStyle.Success);

        const afterYouButton = new ButtonBuilder()
          .setCustomId(`after-you-${userID}`)
          .setLabel("좀 이따가 갈게요! 먼저 하세요!")
          .setEmoji("🙏")
          .setDisabled(false)
          .setStyle(ButtonStyle.Primary);

        const absentButton = new ButtonBuilder()
          .setCustomId(`absent-remind-${userID}`)
          .setLabel("불참이에요")
          .setEmoji("😢")
          .setDisabled(false)
          .setStyle(ButtonStyle.Danger);

        const buttonComponents = new ActionRowBuilder<ButtonBuilder>({
          components: [goButton, afterYouButton, absentButton]
        });

        const message = await member.user.send({
          content: `\`${schedule.title}\` 일정이 15분 뒤에 시작해요! 참여 여부에 대해서 답해주세요!`,
          components: [buttonComponents]
        });
        const collector = message.createMessageComponentCollector({
          filter: ({ user }) => user.id === userID
        });

        collector.on("collect", async (collectInteraction) => {
          switch (collectInteraction.customId) {
            case `go-${userID}`:
              const goingEmbed = new EmbedBuilder()
                .setColor(0x5aa363)
                .setAuthor({
                  name: member.displayName,
                  iconURL:
                    member.avatarURL() ??
                    "https://github.com/GSM-MSG/Salt-Bot/assets/74440939/e05f8800-1555-4cba-b1d9-c45db38ebcb4"
                })
                .setTitle("참여할거에요!")
                .setTimestamp();
              await thread.send({
                embeds: [goingEmbed]
              });
              await message.edit({
                content: "답해주셔서 고마워요!",
                components: undefined
              });
              await collectInteraction.reply({
                content: "답변을 전송했어요!"
              });
              break;

            case `after-you-${userID}`:
              const afterYouEmbed = new EmbedBuilder()
                .setColor(0x4952bd)
                .setAuthor({
                  name: member.displayName,
                  iconURL:
                    member.avatarURL() ??
                    "https://github.com/GSM-MSG/Salt-Bot/assets/74440939/e05f8800-1555-4cba-b1d9-c45db38ebcb4"
                })
                .setTitle("좀 이따가 갈게요! 먼저 하세요!")
                .setTimestamp();
              await thread.send({
                embeds: [afterYouEmbed]
              });
              await message.edit({
                content: "답해주셔서 고마워요!",
                components: undefined
              });
              await collectInteraction.reply({
                content: "답변을 전송했어요!"
              });
              break;

            case `absent-remind-${userID}`:
              const modal = new ModalBuilder()
                .setCustomId(`absent-remind-modal-${userID}`)
                .setTitle("불참")
                .setComponents([
                  new ActionRowBuilder<TextInputBuilder>({
                    components: [
                      new TextInputBuilder()
                        .setCustomId("reason")
                        .setLabel("불참 사유를 입력해주세요!")
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(1)
                        .setMaxLength(300)
                        .setRequired(true)
                    ]
                  })
                ]);
              await collectInteraction.showModal(modal);
              const modalSubmit = await collectInteraction.awaitModalSubmit({ time: 60_000 });
              const reason = modalSubmit.fields.getTextInputValue("reason");

              const absentEmbed = new EmbedBuilder()
                .setColor(0xdb504c)
                .setAuthor({
                  name: member.displayName,
                  iconURL:
                    member.avatarURL() ??
                    "https://github.com/GSM-MSG/Salt-Bot/assets/74440939/e05f8800-1555-4cba-b1d9-c45db38ebcb4"
                })
                .setTitle("불참이에요..")
                .setDescription(reason)
                .setTimestamp();
              await thread.send({
                embeds: [absentEmbed]
              });
              await message.edit({
                content: "답해주셔서 고마워요!",
                components: undefined
              });
              await modalSubmit.reply({
                content: "답변을 전송했어요!"
              });
              break;

            default:
              break;
          }
        });
      }
    });
  }
}
