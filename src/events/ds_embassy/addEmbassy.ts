import {
  ChannelType,
  PermissionFlagsBits,
  type Client,
  type GuildMember
} from 'discord.js';
import { GuildConfigModel } from '../../db/models/GuildConfig';
import { logger } from '../../lib/logger';
import { syncMember } from '../../sync/syncMembers';
import { memberHasRole } from '../../utils/dbRoles';
import { embassyWelcomeEmbed } from '../../utils/embedConfig/embeds';
import { getServerId } from '../../utils/membership';

const privateTextPermissions = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.EmbedLinks
];

const privateVoicePermissions = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.Speak,
  PermissionFlagsBits.UseVAD
];

function privateChannelName(username: string) {
  const safeUsername = username
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 70) || 'diplomat';

  return `dip-${safeUsername}`;
}

export async function addEmbassy(member: GuildMember, client: Client) {
  if (member.user.bot) return;

  const guildConfig = await GuildConfigModel.findOne({ guildId: member.guild.id }).lean();
  const diplomatRoleId = guildConfig?.roles?.diplomat;
  const ambassadorRoleId = guildConfig?.roles?.ambassador;

  if (!diplomatRoleId || !ambassadorRoleId) {
    logger.warn(`addEmbassy: brak konfiguracji ról diplomat/ambassador dla ${member.guild.id}`);
    return;
  }

  // Dyplomaci i wyższe role mają już dostęp do Embassy, więc nie tworzymy im
  // prywatnej kategorii ani nie zmieniamy ich ról.
  if (await memberHasRole(member, ['diplomat', 'officer', 'liche', 'emperor'], 'any')) {
    return;
  }

  const diplomatRole = await member.guild.roles.fetch(diplomatRoleId).catch(() => null);
  const ambassadorRole = await member.guild.roles.fetch(ambassadorRoleId).catch(() => null);
  if (!diplomatRole || !ambassadorRole) {
    logger.warn(`addEmbassy: nie znaleziono ról Embassy dla ${member.user.tag}`);
    return;
  }

  const createdChannels: Array<{ delete: (reason?: string) => Promise<unknown> }> = [];

  try {
    await member.roles.add(ambassadorRole, 'Automatyczny dostęp do Dark Star Embassy');

    // Kategoria ukrywa całą prywatną przestrzeń przed @everyone.
    const category = await member.guild.channels.create({
      name: `Diplomacy-${member.user.username}`.slice(0, 100),
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: member.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        { id: member.id, allow: privateTextPermissions.concat(privateVoicePermissions) },
        { id: diplomatRole.id, allow: privateTextPermissions.concat(privateVoicePermissions) }
      ],
      reason: `Utworzenie przestrzeni Embassy dla ${member.user.tag}`
    });
    createdChannels.push(category);

    const textChannel = await member.guild.channels.create({
      name: privateChannelName(member.user.username),
      type: ChannelType.GuildText,
      parent: category,
      permissionOverwrites: [
        { id: member.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: member.id, allow: privateTextPermissions },
        { id: diplomatRole.id, allow: privateTextPermissions }
      ],
      reason: `Kanał tekstowy Embassy dla ${member.user.tag}`
    });
    createdChannels.push(textChannel);

    const voiceChannel = await member.guild.channels.create({
      name: 'voice',
      type: ChannelType.GuildVoice,
      parent: category,
      permissionOverwrites: [
        { id: member.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: member.id, allow: privateVoicePermissions },
        { id: diplomatRole.id, allow: privateVoicePermissions }
      ],
      reason: `Kanał głosowy Embassy dla ${member.user.tag}`
    });
    createdChannels.push(voiceChannel);

    await textChannel.send({
      content: `${member}`,
        embeds: [embassyWelcomeEmbed(member, textChannel.id, voiceChannel.id, ambassadorRoleId)]
    });

    await syncMember(member);
    logger.info(`addEmbassy: utworzono przestrzeń dla ${member.user.tag}`);
  } catch (error) {
    for (const channel of createdChannels.reverse()) {
      await channel.delete('Rollback nieudanej konfiguracji Embassy').catch(() => undefined);
    }

    await member.roles.remove(ambassadorRole, 'Nie udało się utworzyć przestrzeni Embassy').catch(() => undefined);
    logger.error(`addEmbassy: błąd dla ${member.user.tag}: ${String(error)}`);
  }
}
