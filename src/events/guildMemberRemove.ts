import { Events } from 'discord.js';
import type { Client, GuildMember, PartialGuildMember } from 'discord.js';
import { removeRecru } from './ds_recru/removeRecru';
import { removeMarket } from './ds_market/removeMarket';
import { removeMain } from './ds_main/removeMain';
import { removeEmbassy } from './ds_embassy/removeEmbassy';
import { logger } from '../lib/logger';
import { env } from '../lib/env'; // Potrzebne do sprawdzenia ID serwera
import { isClusterBanInProgress } from './clusterBanState';


export const name = Events.GuildMemberRemove;

export async function execute(
  member: GuildMember | PartialGuildMember,
  client: Client
) {
  try {
    if (isClusterBanInProgress(member.id)) return;

    if (member.guild.id === env.GUILD_RECRUITMENT_ID) {
        await removeRecru(member, client); 
    }
    
    
    if (member.guild.id === env.GUILD_MAIN_ID) { 
        await removeMain(member, client); 
    }
    if (member.guild.id === env.GUILD_EMBASSY_ID) { 
      await removeEmbassy(member, client);
    }

    if (member.guild.id === env.GUILD_MARKET_ID) { 
        await removeMarket(member); 
    }
    
  } catch (error) {
    logger.error('Błąd w guildMemberRemove: %o', error instanceof Error ? error.message : String(error));
  }
}