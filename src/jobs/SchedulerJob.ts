import { DateTime } from "luxon";
import { Job } from "../interfaces/Job";
import { scheduleRepository } from "../repositories/ScheduleRepository";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  ComponentType,
  EmbedBuilder,
  Message,
  ModalBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder
} from "discord.js";
import { FormatUtils } from "../utils/FormatUtils";
import { Schedule } from "../models/Schedule";
import ms from "ms";

export class SchedulerJob extends Job {
  name: string = "scheduler-job";
  schedule = "* * * * *";
  initialDelaySecond = 60 - DateTime.now().setZone("Asia/Seoul").second;

  constructor(private readonly client: Client) {
    super();
  }

  async run(): Promise<void> {
    const currentDate = DateTime.now().setZone("Asia/Seoul");
    const schedules = await scheduleRepository.getSchedules((schedule) => {
      return (
        schedule.year === currentDate.year &&
        schedule.month === currentDate.month &&
        schedule.day === currentDate.day &&
        schedule.hour === currentDate.hour &&
        schedule.minute === currentDate.minute
      );
    });

    schedules.forEach(async (schedule) => {
      const channel: TextChannel = (await this.client.channels.fetch(
        schedule.channelID
      )) as TextChannel;

      const scheduleMemberSelectMenu = new UserSelectMenuBuilder()
        .setCustomId(`schedule-member-${schedule.id}`)
        .setPlaceholder("오지않는 팀원을 불러보세요!");

      const row = new ActionRowBuilder<UserSelectMenuBuilder>({
        components: [scheduleMemberSelectMenu]
      });

      const guild = await this.client.guilds.fetch(schedule.guildID);
      const userMentionString = await Promise.all(
        schedule.userIDs
          .map((userID) => guild.members.fetch(userID))
          .map(async (user) => FormatUtils.userMention((await user).user.id))
      );
      const scheduleMessage = await channel.send({
        content: `
## [${schedule.hour}:${schedule.minute}] ${schedule.title}

${schedule.content}

참여하시는분들 : ${userMentionString.join(" ")}
        `,
        components: [row]
      });

      await this.callUserButton(scheduleMessage, schedule);

      if (!schedule.isRepeat) {
        await scheduleRepository.deleteSchedule(schedule.id);
        return;
      }
      const repeatMilisecond = ms(schedule.repeatPattern);
      const nextDate = DateTime.local(
        schedule.year,
        schedule.month,
        schedule.day,
        schedule.hour,
        schedule.minute,
        0,
        {
          zone: "Asia/Seoul"
        }
      ).plus(repeatMilisecond);
      schedule.year = nextDate.year;
      schedule.month = nextDate.month;
      schedule.day = nextDate.day;
      schedule.hour = nextDate.hour;
      schedule.minute = nextDate.minute;

      await scheduleRepository.saveSchedule(schedule);
    });
  }

  async callUserButton(scheduleMessage: Message<boolean>, schedule: Schedule): Promise<void> {
    const userSelectCollector = scheduleMessage.createMessageComponentCollector({
      componentType: ComponentType.UserSelect,
      time: 60_000 * 15 // 15분
    });
    userSelectCollector.on("collect", async (collectInteraction) => {
      const selectedUser = collectInteraction.users.first();
      if (!selectedUser) return;
      if (selectedUser.bot) return;
      if (!schedule.userIDs.includes(selectedUser.id)) return;

      const goingButton = new ButtonBuilder()
        .setCustomId(`going-${selectedUser.id}`)
        .setLabel("가고있어요..!")
        .setEmoji("🏃‍♂️")
        .setDisabled(false)
        .setStyle(ButtonStyle.Success);

      const willGoButton = new ButtonBuilder()
        .setCustomId(`will-go-${selectedUser.id}`)
        .setLabel("좀 늦어요! 먼저 하세요!")
        .setEmoji("🙏")
        .setDisabled(false)
        .setStyle(ButtonStyle.Primary);

      const absentButton = new ButtonBuilder()
        .setCustomId(`absent-${selectedUser.id}`)
        .setLabel("불참이에요")
        .setEmoji("😢")
        .setDisabled(false)
        .setStyle(ButtonStyle.Danger);

      const buttonComponents = new ActionRowBuilder<ButtonBuilder>({
        components: [goingButton, willGoButton, absentButton]
      });

      const waitMessage = await selectedUser.send({
        content: `\`${schedule.title}\` - 팀원들이 ${selectedUser.displayName}님을 애타게 찾고 있어요..!`,
        components: [buttonComponents]
      });

      if (collectInteraction.replied) {
        await collectInteraction.followUp({
          content: `${selectedUser.displayName}님을 불렀어요!`
        });
      } else {
        await collectInteraction.reply({
          content: `${selectedUser.displayName}님을 불렀어요!`
        });
      }

      const collector = waitMessage.createMessageComponentCollector({
        filter: ({ user }) => user.id == selectedUser.id
      });

      collector.on("collect", async (waitCollectInteraction) => {
        let thread = scheduleMessage.thread;
        if (!thread) {
          thread = await scheduleMessage.startThread({
            name: "늦으신 분들!"
          });
        }

        switch (waitCollectInteraction.customId) {
          case `going-${selectedUser.id}`:
            const goingEmbed = new EmbedBuilder()
              .setColor(0x5aa363)
              .setAuthor({
                name: selectedUser.displayName,
                iconURL:
                  selectedUser.avatarURL() ??
                  "https://github.com/GSM-MSG/Salt-Bot/assets/74440939/e05f8800-1555-4cba-b1d9-c45db38ebcb4"
              })
              .setTitle("지금 가는 중..!")
              .setTimestamp();
            await thread.send({
              embeds: [goingEmbed]
            });
            await waitMessage.edit({
              content: "답해주셔서 고마워요!",
              components: []
            });
            await waitCollectInteraction.reply({
              content: "답변을 전송했어요!"
            });
            break;

          case `will-go-${selectedUser.id}`:
            const willGoEmbed = new EmbedBuilder()
              .setColor(0x4952bd)
              .setAuthor({
                name: selectedUser.displayName,
                iconURL:
                  selectedUser.avatarURL() ??
                  "https://github.com/GSM-MSG/Salt-Bot/assets/74440939/e05f8800-1555-4cba-b1d9-c45db38ebcb4"
              })
              .setTitle("좀 늦어요! 먼저 하세요!")
              .setTimestamp();
            await thread.send({
              embeds: [willGoEmbed]
            });
            await waitMessage.edit({
              content: "답해주셔서 고마워요!",
              components: []
            });
            await waitCollectInteraction.reply({
              content: "답변을 전송했어요!"
            });
            break;

          case `absent-${selectedUser.id}`:
            const modal = new ModalBuilder()
              .setCustomId(`absent-modal-${selectedUser.id}`)
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
            await waitCollectInteraction.showModal(modal);
            const modalSubmit = await waitCollectInteraction.awaitModalSubmit({ time: 60_000 });
            const reason = modalSubmit.fields.getTextInputValue("reason");

            const absentEmbed = new EmbedBuilder()
              .setColor(0xdb504c)
              .setAuthor({
                name: selectedUser.displayName,
                iconURL:
                  selectedUser.avatarURL() ??
                  "https://github.com/GSM-MSG/Salt-Bot/assets/74440939/e05f8800-1555-4cba-b1d9-c45db38ebcb4"
              })
              .setTitle("불참이에요..")
              .setDescription(reason)
              .setTimestamp();
            await thread.send({
              embeds: [absentEmbed]
            });
            await waitMessage.edit({
              content: "답해주셔서 고마워요!",
              components: []
            });
            await modalSubmit.reply({
              content: "앞으로 불참은 회의 전에 미리 답해주세요..! 😢 불참 내용은 전달했어요!"
            });
            break;

          default:
            break;
        }
      });
    });
  }
}
