import { EmbedBuilder } from 'discord.js';
import { THUMBNAILS } from './thumbnails';
import { COLORS } from './colors';
import { EMOJI } from './emoji';
import type { GuildMember, PartialGuildMember, User } from 'discord.js';
import type { IWarn } from '../../db/models/Warn';

type MemberLike = GuildMember | PartialGuildMember;

function memberName(member: MemberLike) {
  return 'displayName' in member && member.displayName
    ? member.displayName
    : member.user.username;
}

function memberAvatar(member: MemberLike) {
  return member.user.displayAvatarURL({ size: 256 });
}

function discordTimestamp(date: Date | number = Date.now()) {
  return `<t:${Math.floor(new Date(date).getTime() / 1000)}:F>`;
}

// Embedy wysyłane na DARK STAR MAIN

export function mainIntruderEmbed(member: GuildMember) {
  return new EmbedBuilder()
    .setTitle(`${EMOJI.ERROR} Brak dostępu do Dark Star Main`)
    .setDescription(`Nie przeszedłeś rekrutacji i nie możesz przebywać na tym serwerze. Zapraszamy na [**REKRUTACJĘ**](https://discord.gg/yM53fbfDZS) (link)!`)
    .setColor(COLORS.ERROR)
    .setThumbnail(memberAvatar(member))
    .addFields({ name: 'Data próby dołączenia:', value: discordTimestamp(), inline: false })
    .setFooter({ text: '✦ ── Dark Star Main ── ✦' });
}

export function mainWelcomeEmbed(member: GuildMember) {
  return new EmbedBuilder()
    .setDescription(`${memberName(member)} **przeszedł rekrutację!** ${EMOJI.DS_LOGO}\n` +
      `ID: \`${member.user.id}\``)
    .setThumbnail(memberAvatar(member))
    .setColor(COLORS.JOIN_SUCCESS)
    .addFields(
      { name: 'Konto utworzone:', value: discordTimestamp(member.user.createdTimestamp), inline: true },
      { name: 'Data dołączenia:', value: discordTimestamp(), inline: false }
    );
}

export function mainLeaveEmbed(member: GuildMember | PartialGuildMember) {
  return new EmbedBuilder()
    .setDescription(
      `${memberName(member)} **nas opuścił!** ${EMOJI.DS_LOGO}\n` +
      `ID: \`${member.user.id}\``
    )
    .setThumbnail(THUMBNAILS.LEAVE)
    .setColor(COLORS.LEAVE)
    .addFields({ name: 'Data opuszczenia:', value: discordTimestamp(), inline: false })
    .setFooter({ text: '✦ ── Dark Star Main ── ✦' });
}

export function promoteEmbed(targetId: string, moderatorId: string) {
  return new EmbedBuilder()
    .setTitle(`${EMOJI.SUCCESS} Użytkownik otrzymał niezbędne rangi!`)
    .setDescription(
      `👤 Użytkownik: <@${targetId}>\n` +
      `👤 Nadano przez: <@${moderatorId}>`
    )
    .setColor(COLORS.SUCCESS)
    .addFields({ name: 'Data awansu:', value: discordTimestamp(), inline: false })
    .setFooter({ text: '✦ ── Dark Star Main ── ✦' });
}

export function banEmbed(
  target: User,
  moderator: User,
  reason: string,
  guildNames: string[]
) {
  return new EmbedBuilder()
    .setTitle(`${EMOJI.ERROR} Użytkownik został zbanowany w klastrze`)
    .setDescription(
      `👤 Zabnowano: <@${target.id}>\n` +
      `ID: \`${target.id}\`\n` +
      `🛡️ Moderator: <@${moderator.id}>`
    )
    .setColor(COLORS.BAN)
    .setThumbnail(THUMBNAILS.BAN)
    .addFields(
      { name: 'Powód:', value: reason, inline: false },
      { name: 'Serwery:', value: guildNames.join(', ') || 'Brak danych', inline: false },
      { name: 'Data bana:', value: discordTimestamp(), inline: false }
    )
    .setFooter({ text: '◆ ── Dark Star Ban ── ◆' });
}

// Embedy wysyłane na DARK STAR MARKET

export function marketIntruderEmbed(member: GuildMember) {
  return new EmbedBuilder()
    .setTitle(`${EMOJI.ERROR} Brak dostępu do Dark Star Market`)
    .setDescription('Nie jesteś członkiem Dark Star i nie możesz przebywać na tym serwerze. Zapraszamy na [**REKRUTACJĘ**](https://discord.gg/yM53fbfDZS) (link)!')
    .setColor(COLORS.ERROR)
    .setThumbnail(memberAvatar(member))
    .addFields({ name: 'Data próby dołączenia:', value: discordTimestamp(), inline: false })
    .setFooter({ text: '◆ ── Dark Star Market ── ◆' });
}

// Embedy wysyłane na DARK STAR REKRUTACJA

export function recruWelcomeEmbed(member: GuildMember) {
  return new EmbedBuilder()
    .setDescription(`${memberName(member)} **dołączył do rekrutacji!** ${EMOJI.DS_LOGO}\n` +
      `ID: \`${member.user.id}\``)
    .setThumbnail(memberAvatar(member))
    .setColor(COLORS.JOIN_STANDARD)
    .addFields(
      { name: 'Konto utworzone:', value: discordTimestamp(member.user.createdTimestamp), inline: true },
      { name: 'Data dołączenia:', value: discordTimestamp(), inline: false }
    );
}

export function recruLeaveEmbed(member: GuildMember | PartialGuildMember) {
  return new EmbedBuilder()
    .setDescription(
      `${memberName(member)} **opuścił rekrutację!** ${EMOJI.DS_LOGO}\n` +
      `ID: \`${member.user.id}\``
    )
    .setThumbnail(THUMBNAILS.LEAVE)
    .setColor(COLORS.LEAVE)
    .addFields({ name: 'Data opuszczenia:', value: discordTimestamp(), inline: false })
    .setFooter({ text: '✧ ── Dark Star Rekrutacja ── ✧' });
}

export function recruDSmemberKickEmbed(member: GuildMember) {
  return new EmbedBuilder()
    .setTitle(`${EMOJI.WARNING} Brak dostępu do rekrutacji`)
    .setDescription('Jesteś już członkiem gildii Dark Star, ale nie posiadasz rangi Enlister bądź wyższej.')
    .setColor(COLORS.WARNING)
    .setThumbnail(memberAvatar(member))
    .addFields({ name: 'Data próby dołączenia:', value: discordTimestamp(), inline: false })
    .setFooter({ text: '✧ ── Dark Star Rekrutacja ── ✧' });
}

// Embedy wysyłane na DARK STAR EMBASSY

export function embassyDSmemberKickEmbed(member: GuildMember) {
  return new EmbedBuilder()
    .setTitle(`${EMOJI.WARNING} Brak dostępu do ambasady`)
    .setDescription('Jesteś już członkiem gildii Dark Star, ale nie posiadasz rangi Dyplomata bądź wyższej.')
    .setColor(COLORS.EMBASSY)
    .setThumbnail(memberAvatar(member))
    .addFields({ name: 'Data próby dołączenia:', value: discordTimestamp(), inline: false })
    .setFooter({ text: '♜ ── Dark Star Embassy ── ♜' });
}

export function embassyWelcomeEmbed(
  member: GuildMember,
  textChannelId: string,
  voiceChannelId: string,
  ambassadorRoleId: string
) {
  return new EmbedBuilder()
    .setColor(COLORS.EMBASSY)
    .setTitle(`${EMOJI.EMBASSY} Witamy w Ambasadzie Dark Star!`)
    .setDescription('Welcome to the Dark Star Embassy!')
    .addFields(
      {
        name: `${EMOJI.FLAG_PL} **Kanały utworzone dla Ciebie:**`,
        value: `• <#${textChannelId}> - kanał tekstowy do komunikacji\n• <#${voiceChannelId}> - kanał głosowy do rozmów`,
        inline: false
      },
      {
        name: `${EMOJI.FLAG_GB} **Channels created for you:**`,
        value: `• <#${textChannelId}> - text channel for communication\n• <#${voiceChannelId}> - voice channel for conversations`,
        inline: false
      },
      {
        name: `${EMOJI.HERALD} **Potrzebujesz pomocy? | Need help?**`,
        value: `${EMOJI.FLAG_PL} Spinguj <@&${ambassadorRoleId}> jeśli czegoś potrzebujesz!\n${EMOJI.FLAG_GB} Ping <@&${ambassadorRoleId}> if you need anything!`,
        inline: false
      }
    )
    .setTimestamp()
    .setFooter({
      text: '♜ ── Chwała Dark Star | Glory to Dark Star! ── ♜',
      iconURL: member.guild.iconURL() ?? undefined
    });
}

export function embassyLeaveEmbed(member: GuildMember | PartialGuildMember) {
  return new EmbedBuilder()
    .setDescription(
      `${memberName(member)} **opuścił Dark Star Embassy!** ${EMOJI.EMBASSY}\n` +
      `ID: \`${member.user.id}\``
    )
    .setThumbnail(THUMBNAILS.LEAVE)
    .setColor(COLORS.LEAVE)
    .addFields({ name: 'Data opuszczenia:', value: discordTimestamp(), inline: false })
    .setFooter({ text: '♜ ── Dark Star Embassy ── ♜' });
}


// Embedy moderacyjne: warny

type WarnTarget = Pick<User, 'id' | 'tag'>;

function warnColor(warnCount: number) {
  if (warnCount >= 3) return COLORS.WARN_HIGH;
  if (warnCount === 2) return COLORS.WARN_MEDIUM;
  return COLORS.WARN_LOW;
}

export function warnEmbed(user: WarnTarget, moderator: WarnTarget, reason: string, warnCount: number) {
  return new EmbedBuilder()
    .setTitle(`${EMOJI.WARNING} Użytkownik został zwarnowany!`)
    .setColor(warnColor(warnCount))
    .addFields(
      { name: 'Użytkownik', value: `<@${user.id}> (${user.tag})`, inline: true },
      { name: 'Moderator', value: `<@${moderator.id}> (${moderator.tag})`, inline: true },
      { name: 'Powód', value: reason, inline: false }
    )
    .setThumbnail(THUMBNAILS.WARN)
    .addFields({ name: 'Data warna:', value: discordTimestamp(), inline: false })
    .setFooter({ text: `⚠ ── Liczba warnów: ${warnCount} ── ⚠` });
}

export function warnMultipleEmbed(user: WarnTarget, moderator: WarnTarget, reason: string, warnCount: number) {
  return warnEmbed(user, moderator, reason, warnCount);
}

export function showWarnEmbed(warn: IWarn) {
  return new EmbedBuilder()
    .setTitle(`${EMOJI.WARNING} Warn #${String(warn._id)}`)
    .setColor(COLORS.WARN_HIGH)
    .addFields(
      { name: 'Użytkownik', value: `<@${warn.warnedMemberId}>`, inline: true },
      { name: 'Moderator', value: `<@${warn.moderatorId}>`, inline: true },
      { name: 'Powód', value: warn.description, inline: false }
    )
    .setThumbnail(THUMBNAILS.WARN)
    .addFields({ name: 'Data warna:', value: discordTimestamp(warn.createdAt), inline: false })
    .setFooter({ text: `⚠ ── Warn ID: ${String(warn._id)} ── ⚠` });
}