import {
  AnyThreadChannel,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  SlashCommandBuilder
} from "discord.js";
import { Command } from "../interfaces/Command";
import { Schedule } from "../models/Schedule";
import { scheduleRepository } from "../repositories/ScheduleRepository";
import { v4 as uuidv4 } from "uuid";
import { FormatUtils } from "../utils/FormatUtils";

export default {
  data: new SlashCommandBuilder().setName("add-schedule").setDescription("새로운 일정을 추가해요!"),
  async execute(interaction: ChatInputCommandInteraction) {
    const textInput = async (
      inputGuideMessage: string,
      description: string | null = null,
      thread: AnyThreadChannel<boolean>
    ): Promise<Message<boolean>> => {
      try {
        const embed = new EmbedBuilder()
          .setColor(0x4952bd)
          .setTitle(`📝 ${inputGuideMessage}`)
          .setDescription(description)
          .setFooter({ text: "'cancel'을 입력하면 일정 생성이 취소돼요!" });
        await thread.send({
          embeds: [embed]
        });

        const inputMessage = await thread.awaitMessages({
          max: 1,
          time: 60_000, // 60초
          filter: (msg) => msg.author.id == interaction.user.id,
          errors: ["time"]
        });
        if (!inputMessage) throw new Error("입력이 되지 않았어요.");

        const inputFirstMessage = inputMessage.first();
        if (!inputFirstMessage) throw new Error("입력이 되지 않았어요.");

        if (inputFirstMessage.content === "cancel") throw new Error("입력이 취소되었어요!");

        return inputFirstMessage;
      } catch (e) {
        thread.setArchived(true);
        if (e instanceof Error) throw e;
        else throw new Error("알 수 없는 에러 발생");
      }
    };
    const parseDateTime = async (input: string) => {
      const [date, time] = input.split(" ");

      if (!date || !time) {
        await interaction.channel?.send({
          content: "포맷이 올바르지 않아요. 'yyyy/MM/dd HH:mm'의 형식대로 다시 입력해주세요."
        });
        throw new Error("포맷이 올바르지 않아요. 'yyyy/MM/dd HH:mm'의 형식대로 다시 입력해주세요.");
      }

      const [year, month, day] = date.split("/").map(Number);
      const [hour, minute] = time.split(":").map(Number);

      if (
        [year, month, day, hour, minute].some(isNaN) ||
        month > 12 ||
        day > 31 ||
        hour > 60 ||
        minute > 60
      ) {
        await interaction.channel?.send({
          content: "숫자가 올바르지 않아요. 올바른 숫자로 다시 시도해주세요."
        });
        throw new Error("숫자가 올바르지 않아요. 올바른 숫자로 다시 시도해주세요.");
      }

      return { year, month, day, hour, minute };
    };
    const parseChannel = async (message: Message<boolean>) => {
      const mentiondChannel = message.mentions.channels.first();
      if (!mentiondChannel) {
        await interaction.channel?.send({
          content: "올바른 채널을 멘션해주세요."
        });
        throw new Error("올바른 채널을 멘션해주세요.");
      }
      return mentiondChannel;
    };
    const parseMentiondUsers = (message: Message<boolean>) => {
      let parsedUserIDs = message.mentions.parsedUsers.map((user) => user.id);
      const memberIDs = message.mentions.roles.reduce<string[]>((acc, role) => {
        const memberIDs = role.members
          .filter((member) => !member.user.bot)
          .map((member) => member.user.id);
        return acc.concat(memberIDs);
      }, []);
      return parsedUserIDs.concat(memberIDs);
    };

    const startMessage = await interaction.reply({
      content: "일정 생성을 시작합니다! 스레드에서 이어지는 질문들에 답해주세요!"
    });
    const scheduleInputThread = await (
      await startMessage.fetch()
    ).startThread({ name: "일정 생성" });
    await scheduleInputThread.send({
      content: FormatUtils.userMention(interaction.user.id)
    });

    const scheduleTitleMessage = await textInput(
      "일정 이름을 입력해주세요!",
      null,
      scheduleInputThread
    );
    const scheduleContentMessage = await textInput(
      "일정 설명을 입력해주세요!",
      "회의 주제, 문서 링크, 장소 등에 대해서 입력해주세요!",
      scheduleInputThread
    );
    const scheduleDateMessage = await textInput(
      "일정의 날짜를 입력해주세요!",
      "[ yyyy/MM/dd HH:mm ] 포맷에 맞춰 입력해주세요!\n★★★★★★★★24시 포맷으로 시간을 정해주세요! (오후 3시 -> 15시)★★★★★★★★\n\ne.g. 2024/7/12 19:30 = 2024년 7월 12일 오후 7시 30분",
      scheduleInputThread
    );
    const parsedDateComponent = await parseDateTime(scheduleDateMessage.content);
    const scheduleChannelMessage = await textInput(
      "메세지를 보낼 채널을 멘션해주세요!",
      FormatUtils.channelMention(interaction.channelId),
      scheduleInputThread
    );
    const mentiondChannel = await parseChannel(scheduleChannelMessage);
    const isRepeatMessage = await textInput(
      "일정이 반복되나요?",
      "[ true or false ]",
      scheduleInputThread
    );
    const isRepeat = isRepeatMessage?.content.toLowerCase() === "true";
    let repeatPattern: Message<boolean> | undefined;
    if (isRepeat) {
      repeatPattern = await textInput(
        "일정 반복 패턴을 입력해주세요!",
        "[ w = 주, d = 일, h = 시간, m = 분 ]\n\ne.g. 1d = 1일, 1w = 1주, 10d = 10일",
        scheduleInputThread
      );
    } else {
      repeatPattern = undefined;
    }
    const isOnReminderMessage = await textInput(
      "15분 전에 리마인더를 보낼까요?",
      "[ true or false ]",
      scheduleInputThread
    );
    const isOnReminder = isOnReminderMessage?.content.toLowerCase() === "true";
    const scheduleParticipantsMessage = await textInput(
      "일정에 참여하는 유저와 역할들을 모두 멘션해주세요!",
      FormatUtils.userMention(interaction.user.id),
      scheduleInputThread
    );
    const userIDs = parseMentiondUsers(scheduleParticipantsMessage);

    const scheduleID = uuidv4().replaceAll("-", "").substring(0, 20);

    const schedule: Schedule = {
      id: scheduleID,
      guildID: interaction.guildId ?? "",
      channelID: mentiondChannel.id,
      title: scheduleTitleMessage.content,
      content: scheduleContentMessage.content,
      year: parsedDateComponent.year,
      month: parsedDateComponent.month,
      day: parsedDateComponent.day,
      hour: parsedDateComponent.hour,
      minute: parsedDateComponent.minute,
      userIDs: userIDs,
      isOnReminder: isOnReminder,
      isRepeat: isRepeat,
      repeatPattern: repeatPattern?.content ?? ""
    };
    await scheduleRepository.saveSchedule(schedule);
    await scheduleInputThread.send({
      content: "일정 생성을 완료했어요!"
    });
    await scheduleInputThread.setArchived(true);
  }
} as Command;
