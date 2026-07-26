import { buildEmbed } from './embedBuilder';
import type { GuildMember } from 'discord.js';


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

export function recruLeaveEmbed(member: GuildMember) {
  return buildEmbed({
    title: `${member.user.username} nas opuścił!`,
    description: `Szkoda, że odszedłeś, ${member.user.username}. Mamy nadzieję, że jeszcze do nas wrócisz!`,
  });
}
