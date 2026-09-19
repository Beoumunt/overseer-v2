import { buildEmbed } from './embedBuilder';
import { THUMBNAILS } from './thumbnails';
import type { GuildMember, PartialGuildMember, User } from 'discord.js';
import type { IWarn } from '../db/models/Warn';


// embedy wysyłane na DARK STAR MAIN

export function mainIntruderEmbed(member: GuildMember) {
  return buildEmbed({
    title: `❌ UWAGA!`,
    description: `Probowałeś dostać się na serwer Dark Star, ale nie jesteś członkiem Dark Star. Wszelkie ponowne próby dostania się na serwer będą skutkowały banem. Jeśli uważasz, że to pomyłka skontaktuj się z administracją Dark Star.`,
  });
}

export function mainWelcomeEmbed(member: GuildMember) {
  return buildEmbed({
    title: `${member.user.username} przeszedł rekrutację!`,
    description: `Cieszymy się, że do nas dołączyłeś, ${member.user.username}!`,
  });
}

export function mainLeaveEmbed(member: GuildMember | PartialGuildMember) {
  return buildEmbed({
    title: `${member.user.username} nas opuścił!`,
    description: `${member.user.username} właśnie opuścił Dark Star`,
  });
}


export function promoteEmbed(member: GuildMember) {
  return buildEmbed({
    title: `${member.user.username} został awansowany!`,
    description: `Gratulacje, ${member.user.username}! Zostałeś pełnoprawnym członkiem Dark Star.`,
  });
}

// embedy wysyłane na DARK STAR MARKET

export function marketIntruderEmbed(member: GuildMember) {
  return buildEmbed({
    title: `❌ UWAGA!`,
    description: `Probowałeś dostać się na serwer Dark Star Market, ale nie jesteś członkiem Dark Star. Wszelkie ponowne próby dostania się na serwer będą skutkowały banem. Jeśli uważasz, że to pomyłka skontaktuj się z administracją Dark Star.`,
  });
}



// embedy wysyłane na DARK STAR REKRU

export function recruWelcomeEmbed(member: GuildMember) {
  return buildEmbed({
    title: `${member.user.username} właśnie dołączył!`,
    description: `Cieszymy się, że do nas dołączyłeś, ${member.user.username}! Aby rozpocząć swoją przygodę, prosimy o zapoznanie się z naszymi zasadami i wypełnienie formularza rekrutacyjnego.`,
  });
}

export function recruLeaveEmbed(member: GuildMember | PartialGuildMember) {
  return buildEmbed({
    title: `${member.user.username} nas opuścił!`,
    description: `Szkoda, że odszedłeś, ${member.user.username}. Mamy nadzieję, że jeszcze do nas wrócisz!`,
  });
}

export function recruDSmemberKickEmbed(member: GuildMember) {
  return buildEmbed({
    title: `UWAGA!`,
    description: `Jesteś już członkiem gildii Dark Star, oraz nie posiadasz rangi Enlister bądź wyższej, zatem nie możesz dołączyć do serwera rekrutacyjnego.`,
  });
}

// embedy wysyłane na DARK STAR EMBASSY

export function embassyDSmemberKickEmbed(member: GuildMember) {
  return buildEmbed({
    title: `UWAGA!`,
    description: `Jesteś już członkiem gildii Dark Star, oraz nie posiadasz rangi Herald bądź wyższej, zatem nie możesz dołączyć do serwera ambasady.`,
  });
}


/**************************************
 * LOGI NA KANAŁ W DS MAIN
 **************************************/
type WarnTarget = Pick<User, 'id' | 'tag'>;

function warnColor(warnCount: number) {
  if (warnCount >= 3) return 0xE74C3C;
  if (warnCount === 2) return 0xF1C40F;
  return 0x2ECC71;
}

export function warnEmbed(
  user: WarnTarget,
  moderator: WarnTarget,
  reason: string,
  warnCount: number
) {
  return buildEmbed({
    title: 'Użytkownik został zwarnowany!',
    color: warnColor(warnCount)
  })
    .addFields(
      { name: 'Użytkownik', value: `<@${user.id}> (${user.tag})`, inline: true },
      { name: 'Moderator', value: `<@${moderator.id}> (${moderator.tag})`, inline: true },
      { name: 'Powód', value: reason, inline: false }
    )
    .setThumbnail(THUMBNAILS.WARN)
    .setTimestamp()
    .setFooter({ text: `Liczba warnów: ${warnCount}` });
}

export function warnMultipleEmbed(
  user: WarnTarget,
  moderator: WarnTarget,
  reason: string,
  warnCount: number
) {
  return warnEmbed(user, moderator, reason, warnCount);
}

export function showWarnEmbed(warn: IWarn) {
  return buildEmbed({
    title: `Warn #${String(warn._id)}`,
    color: 0xE74C3C
  })
    .addFields(
      { name: 'Użytkownik', value: `<@${warn.warnedMemberId}>`, inline: true },
      { name: 'Moderator', value: `<@${warn.moderatorId}>`, inline: true },
      { name: 'Powód', value: warn.description, inline: false }
    )
    .setThumbnail(THUMBNAILS.WARN)
    .setTimestamp(warn.createdAt)
    .setFooter({ text: `Warn ID: ${String(warn._id)}` });
}
