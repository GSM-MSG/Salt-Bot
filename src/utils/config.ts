import "dotenv/config";

export interface Config {
  discordToken: string;
  githubToken: string;
  guildID: string;
  apiKey: string;
  authDomain: string;
  projectID: string;
  storageBucket: string;
  messagingSenderID: string;
  appID: string;
}

export const config: Config = {
  discordToken: process.env.DISCORD_TOKEN ?? "",
  githubToken: process.env.GITHUB_TOKEN ?? "",
  guildID: process.env.GUILD_ID ?? "",
  apiKey: process.env.API_KEY ?? "",
  authDomain: process.env.AUTH_DOMAIN ?? "",
  projectID: process.env.PROJECT_ID ?? "",
  storageBucket: process.env.STORAGE_BUCKET ?? "",
  messagingSenderID: process.env.MESSAGING_SENDER_ID ?? "",
  appID: process.env.APP_ID ?? ""
};
