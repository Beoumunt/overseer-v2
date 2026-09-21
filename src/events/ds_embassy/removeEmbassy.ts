import { ChannelType, type Client, type GuildMember, type PartialGuildMember } from 'discord.js';
import { logger } from '../../lib/logger';
import { syncMember } from '../../sync/syncMembers';
import { embassyLeaveEmbed } from '../../utils/embedConfig/embeds';
import { getChannelFromClient } from '../../utils/discord';
import { GuildConfigModel } from '../../db/models/GuildConfig';

export async function removeEmbassy(
  member: GuildMember | PartialGuildMember,
  client: Client
) {
  if (member.user.bot) return;

  try {
    const guildConfig = await GuildConfigModel.findOne({ guildId: member.guild.id }).lean();
    const welcomeChannelId = guildConfig?.channels?.welcome;
    const welcomeChannel = await getChannelFromClient(client, member.guild.id, welcomeChannelId);

    if (welcomeChannel?.isTextBased() && !welcomeChannel.isDMBased()) {
      await welcomeChannel.send({ embeds: [embassyLeaveEmbed(member)] });
    }

    // Kategoria nie ma osobnej kolekcji: odnajdujemy ją po overwrite dla
    // użytkownika, który ją posiadał. Usuwamy dzieci przed kategorią.
    const privateCategories = member.guild.channels.cache.filter(channel =>
      channel.type === ChannelType.GuildCategory && channel.permissionOverwrites.cache.has(member.id)
    );

    for (const category of privateCategories.values()) {
      const children = member.guild.channels.cache.filter(channel => channel.parentId === category.id);
      for (const child of children.values()) {
        await child.delete('Użytkownik opuścił Dark Star Embassy').catch(error => {
          logger.warn(`removeEmbassy: nie udało się usunąć kanału ${child.id}: ${String(error)}`);
        });
      }
      await category.delete('Użytkownik opuścił Dark Star Embassy').catch(error => {
        logger.warn(`removeEmbassy: nie udało się usunąć kategorii ${category.id}: ${String(error)}`);
      });
    }

    await syncMember(member);
    logger.info(`removeEmbassy: obsłużono opuszczenie Embassy przez ${member.user.tag}`);
  } catch (error) {
    logger.error(`removeEmbassy: błąd dla ${member.user.tag}: ${String(error)}`);
  }
}
