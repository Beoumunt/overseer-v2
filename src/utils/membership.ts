import { env } from '../lib/env';

export function getServerId(guildName: string) {
  if (guildName === 'recruitment') return env.GUILD_RECRUITMENT_ID;
  if (guildName === 'main') return env.GUILD_MAIN_ID;
  if (guildName === 'embassy') return env.GUILD_EMBASSY_ID;
  if (guildName === 'market') return env.GUILD_MARKET_ID;
  return guildName;
}

export function getMembershipKey(guildId: string) {
  if (guildId === env.GUILD_RECRUITMENT_ID) return 'recruitment';
  if (guildId === env.GUILD_MAIN_ID) return 'main';
  if (guildId === env.GUILD_EMBASSY_ID) return 'embassy';
  if (guildId === env.GUILD_MARKET_ID) return 'market';
  return guildId;
}