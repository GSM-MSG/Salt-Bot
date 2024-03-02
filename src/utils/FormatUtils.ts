export class FormatUtils {
  public static channelMention(discordId: string): string {
    return `<#${discordId}>`;
  }

  public static userMention(discordId: string): string {
    return `<@!${discordId}>`;
  }
}
