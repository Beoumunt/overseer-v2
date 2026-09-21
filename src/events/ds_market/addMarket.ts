import { Client, GuildMember } from 'discord.js';
import { marketIntruderEmbed } from '../../utils/embedConfig/embeds';
import { GuildConfigModel } from '../../db/models/GuildConfig';
import { logger } from '../../lib/logger';
import { syncMember } from '../../sync/syncMembers';
import { memberHasRole } from '../../utils/dbRoles';
import { getServerId } from '../../utils/membership';
import { getRoleFromClient } from '../../utils/discord';
/*
    1. Sprawdzamy czy uzytkownik jest w ds_main i czy ma dangę darkStar
    2a. Jeśli tak: nadajemy mu rangę w markecie
    2b. Jeśli nie: wysyłamy mu wiadomość prywatną z informacją, że nie jest członkiem Dark Star i nie może przebywać na tym discordzie
*/

export async function addMarket(member: GuildMember, client: Client) {

  if (member.user.bot) return;
  
  // Jeżeli nie jest członkiem Dark Star: wysłanie wiadomości -> kick -> log
  if (!await memberHasRole(member, ['darkStar'], 'all')) {
    member.send({ embeds: [marketIntruderEmbed(member)] });
    member.kick('Nie jest członkiem Dark Star, nie może przebywać na tym discordzie').catch(() => {});
    logger.info(`addMarket: wyrzucono ${member.user.tag} (${member.id}) z marketu, ponieważ nie jest członkiem Dark Star`);
    return;
  }

  const marketGuildId = getServerId('market');
  const cfg = await GuildConfigModel.findOne({ guildId: marketGuildId }).lean();
  const darkStarRoleId = cfg?.roles?.darkStar;

  if (!darkStarRoleId) {
    return;
  }

  try {
    const role = await getRoleFromClient(client, marketGuildId, darkStarRoleId);
    if (!role) {
      logger.warn(`addMarket: nie znaleziono roli darkStar ${darkStarRoleId} w guild ${member.guild.id}`);
      return;
    }

    // Nadanie roli darkStar na markecie
    await member.roles.add(role);

    logger.info(`addMarket: nadano rolę darkStar ${role.name} (${role.id}) dla ${member.user.tag}`);
    // Synchronizacja uzytkownika z bazą danych
    await syncMember(member);

  } catch (error) {
    logger.error(`addMarket: błąd podczas nadawania roli darkStar dla ${member.user.tag} w guild ${member.guild.id}: ${String(error)}`);
  }
}