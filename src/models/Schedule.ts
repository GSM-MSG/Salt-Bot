export interface Schedule {
  id: string;
  guildID: string;
  channelID: string;
  title: string;
  content: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  userIDs: string[];
  isOnReminder: boolean;
  isRepeat: boolean;
  repeatPattern: string;
}
