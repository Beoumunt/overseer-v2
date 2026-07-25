import { buildEmbed } from './embedBuilder';
import type { GuildMember } from 'discord.js';

// embedy wysyłane na DARK STAR REKRU

export function recruWelcomeEmbed(member: GuildMember) {
  return buildEmbed({
    title: `${member.user.username} właśnie dołączył!`,
    description: `Cieszymy się, że do nas dołączyłeś, ${member.user.username}! Aby rozpocząć swoją przygodę, prosimy o zapoznanie się z naszymi zasadami i wypełnienie formularza rekrutacyjnego.`,
  });
}
