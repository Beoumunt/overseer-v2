import { Events, GuildMember } from 'discord.js';
import { addRecru } from './ds_recru/addRecru';
import { logger } from '../lib/logger';
import { env } from '../lib/env'; // Potrzebne do sprawdzenia ID serwera

export const name = Events.GuildMemberAdd;

export async function execute(member: GuildMember) {
  try {
    // Sprawdzamy, czy dołączenie nastąpiło na serwerze rekrutacyjnym
    if (member.guild.id === env.GUILD_RECRUITMENT_ID) {
        await addRecru(member);
    }
    
    /*
    if (member.guild.id === env.GUILD_MAIN_ID) { 
        await addMain(member); 
    }

    if (member.guild.id === env.GUILD_EMBASSY_ID) { 
        await addMain(member); 
    }

    if (member.guild.id === env.GUILD_MARKET_ID) { 
        await addMain(member); 
    }

    */
    
  } catch (error) {
    logger.error('Błąd w guildMemberAdd: %o', error instanceof Error ? error.message : String(error));
  }
}