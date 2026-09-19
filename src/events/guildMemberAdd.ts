import { Events } from 'discord.js';
import type { Client, GuildMember } from 'discord.js';
import { addRecru } from './ds_recru/addRecru';
import { addMarket } from './ds_market/addMarket';
import { addMain } from './ds_main/addMain';
// import { addEmbassy } from './ds_embassy/addEmbassy';
import { logger } from '../lib/logger';
import { env } from '../lib/env'; // Potrzebne do sprawdzenia ID serwera

export const name = Events.GuildMemberAdd;

export async function execute(member: GuildMember, client: Client) {
  try {
    // Sprawdzamy, czy dołączenie nastąpiło na serwerze rekrutacyjnym
    if (member.guild.id === env.GUILD_RECRUITMENT_ID) {
        await addRecru(member, client);
    }
    
    
    if (member.guild.id === env.GUILD_MAIN_ID) { 
        await addMain(member, client); 
    }
    /*
    if (member.guild.id === env.GUILD_EMBASSY_ID) { 
        await addEmbassy(member); 
    }
    */

    if (member.guild.id === env.GUILD_MARKET_ID) { 
        await addMarket(member, client); 
    }
    
  } catch (error) {
    logger.error('Błąd w guildMemberAdd: %o', error instanceof Error ? error.message : String(error));
  }
}