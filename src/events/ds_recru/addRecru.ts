import { GuildMember } from 'discord.js';
import { GuildConfigModel } from '../../db/models/GuildConfig';
import { logger } from '../../lib/logger';
import { syncMember } from '../../sync/syncMembers';
import { recruWelcomeEmbed, recruDSmemberKickEmbed } from '../../utils/embeds';
import { sendEmbed } from '../../utils/embedBuilder';
import { getServerId } from '../../utils/membership';
import { getChannelFromMember, getRoleFromMember } from '../../utils/discord';
import { memberHasRole } from '../../utils/dbRoles';

export async function addRecru(member: GuildMember) {

  if (member.user.bot) return;

  const recruGuildId = getServerId('recruitment');
  const cfg = await GuildConfigModel.findOne({ guildId: recruGuildId }).lean();
  const candidateRoleId = cfg?.roles?.candidate;
  const enlisterRoleId = cfg?.roles?.enlister;

  if (!candidateRoleId) {
    logger.warn(`addRecru: brak roli candidate w GuildConfig dla guild ${member.guild.id}`);
    return;
  } else if (!enlisterRoleId) {
    logger.warn(`addRecru: brak roli enlister w GuildConfig dla guild ${member.guild.id}`);
    return;
  }

  // jeżeli osoba jest w kadrze zarządczej to może wejść na serwer i otrzymuje rolę Enlister na ds_recru
  // jeżeli jest zwykłym członkiem to nie może wejść na serwer
  if(await memberHasRole(member, ['enlister', 'officer', 'liche', 'emperor'], 'any')) {
    const role = await getRoleFromMember(member, enlisterRoleId);

    if (!role) {
      logger.warn(`addRecru: nie znaleziono roli enlister ${enlisterRoleId} w ds_recru`);
      return;
    }
    await member.roles.add(role);
    logger.info(`addRecru: nadano rolę enlister dla ${member.user.tag} w ds_recru.`);
    await syncMember(member);

  } else if(await memberHasRole(member, ['darkStar'], 'all')) {
    sendEmbed(member, recruDSmemberKickEmbed(member));
    member.kick('Już przeszedł rekrutacje.').catch(() => {});
    return;
  }

  try {
    const role = await getRoleFromMember(member, candidateRoleId);
    if (!role) {
      logger.warn(`addRecru: nie znaleziono roli candidate ${candidateRoleId} w ds_recru`);
      return;
    }

    // Nadanie roli candidate
    await member.roles.add(role);
    logger.info(`addRecru: nadano rolę candidate dla ${member.user.tag} w ds_recru`);
    // Synchronizacja uzytkownika z bazą danych
    await syncMember(member);

    // Wysłanie wiadomości na kanał o tym, że użytkownik dołączył do serwera rekrutacyjnego
    const welcomeChannelId = cfg?.channels?.welcome;

    if (!welcomeChannelId) {
      return;
    } else {
      const channel = await getChannelFromMember(member, welcomeChannelId);
      if (!channel || !channel.isTextBased() || channel.isDMBased()) {
        return;
      }
      sendEmbed(channel, recruWelcomeEmbed(member));
    }

  } catch (error) {
    logger.error(`addRecru: błąd podczas nadawania roli candidate dla ${member.user.tag} w guild ${member.guild.id}: ${String(error)}`);
  }
}