import { GuildMember } from 'discord.js';
import { GuildConfigModel } from '../../db/models/GuildConfig';
import { logger } from '../../lib/logger';
import { syncMember } from '../../sync/syncMembers';
import { memberHasRole } from '../../utils/dbRoles';
/*
    1. Sprawdzamy czy uzytkownik jest w ds_main i czy ma dangę darkStar
    2a. Jeśli tak: nadajemy mu rangę w markecie
    2b. Jeśli nie: wysyłamy mu wiadomość prywatną z informacją, że nie jest członkiem Dark Star i nie może przebywać na tym discordzie
*/

export async function addMarket(member: GuildMember) {

  if (member.user.bot) return;

  const cfg = await GuildConfigModel.findOne({ guildId: member.guild.id }).lean();
  const darkStarRoleId = cfg?.roles?.darkStar;
  if (!darkStarRoleId) {
    logger.warn(`addMarket: brak roli darkStar w GuildConfig dla guild ${member.guild.id}`);
    return;
  }

  if (!await memberHasRole(member, ['darkStar'], 'all')) {
    // tu wysyłka wiadomości prywatnej do użytkownika
    return;
  }

  try {
    const role = member.guild.roles.cache.get(darkStarRoleId) ?? await member.guild.roles.fetch(darkStarRoleId).catch(() => null);
    if (!role) {
      logger.warn(`addMarket: nie znaleziono roli darkStar ${darkStarRoleId} w guild ${member.guild.id}`);
      return;
    }

    // Nadanie roli darkStar
    await member.roles.add(role);
    logger.info(`addMarket: nadano rolę darkStar ${role.name} (${role.id}) dla ${member.user.tag} w guild ${member.guild.id}`);
    // Synchronizacja uzytkownika z bazą danych
    await syncMember(member);

  } catch (error) {
    logger.error(`addMarket: błąd podczas nadawania roli darkStar dla ${member.user.tag} w guild ${member.guild.id}: ${String(error)}`);
  }
}