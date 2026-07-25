import { GuildMember } from 'discord.js';
import { GuildConfigModel } from '../../db/models/GuildConfig';
import { logger } from '../../lib/logger';
import { syncMember } from '../../sync/syncMembers';
import { recruWelcomeEmbed } from '../../utils/embeds';
import { sendEmbed } from '../../utils/embedBuilder';

export async function addRecru(member: GuildMember) {

  if (member.user.bot) return;

  const cfg = await GuildConfigModel.findOne({ guildId: member.guild.id }).lean();
  const candidateRoleId = cfg?.roles?.candidate;
  if (!candidateRoleId) {
    logger.warn(`addRecru: brak roli candidate w GuildConfig dla guild ${member.guild.id}`);
    return;
  }

  try {
    const role = member.guild.roles.cache.get(candidateRoleId) ?? await member.guild.roles.fetch(candidateRoleId).catch(() => null);
    if (!role) {
      logger.warn(`addRecru: nie znaleziono roli candidate ${candidateRoleId} w guild ${member.guild.id}`);
      return;
    }

    // Nadanie roli candidate
    await member.roles.add(role);
    logger.info(`addRecru: nadano rolę candidate ${role.name} (${role.id}) dla ${member.user.tag} w guild ${member.guild.id}`);
    // Synchronizacja uzytkownika z bazą danych
    await syncMember(member);

    // Wysłanie wiadomości na kanał o tym, że użytkownik dołączył do serwera rekrutacyjnego
    const welcomeChannelId = cfg?.channels?.welcome;

    if (!welcomeChannelId) {
      return;
    } else {
      const channel = member.guild.channels.cache.get(welcomeChannelId) ?? await member.guild.channels.fetch(welcomeChannelId).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        return;
      }
      sendEmbed(channel, recruWelcomeEmbed(member));
    }

  } catch (error) {
    logger.error(`addRecru: błąd podczas nadawania roli candidate dla ${member.user.tag} w guild ${member.guild.id}: ${String(error)}`);
  }
}
