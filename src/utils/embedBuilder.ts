import { GuildMember, EmbedBuilder, User } from 'discord.js';

type SendableChannel = { send: (payload: any) => Promise<any> };

export interface EmbedInput {
  title?: string;
  description?: string;
  image?: string;                   // URL do obrazka / GIF
  color?: string | number;          // hex '#RRGGBB' lub number (0xRRGGBB)
  content?: string;                 // opcjonalny tekst towarzyszący embedowi
}

/**
 * Zwraca EmbedBuilder z podstawowymi polami:
 * title, description, image, kolor (color).
 */
export function buildEmbed(opts: EmbedInput): EmbedBuilder {
  const e = new EmbedBuilder();

  if (opts.title) e.setTitle(opts.title);
  if (opts.description) e.setDescription(opts.description);

  if (opts.color !== undefined) {
    if (typeof opts.color === 'number') {
      e.setColor(opts.color);
    } else if (typeof opts.color === 'string') {
      const c = opts.color.trim();
      if (c.startsWith('#') && /^[0-9A-Fa-f]{6}$/.test(c.slice(1))) {
        e.setColor(Number(`0x${c.slice(1)}`));
      } else if (/^[0-9A-Fa-f]{6}$/.test(c)) {
        e.setColor(Number(`0x${c}`));
      } else {

        try { e.setColor(c as any); } catch { /* ignoruj */ }
      }
    }
  }

  if (opts.image) e.setImage(opts.image);

  return e;
}

/**
 * Bezpieczne wysłanie prostego embeda na kanał.
 * Przyjmuje kanał, opcje embedu i opcjonalne dodatkowe send options.
 */

export async function sendEmbed(
    channel:        SendableChannel | User, 
    opts:           EmbedBuilder, 
    sendOptions:    Record<string, any> = {}
) {
  if (!channel || typeof channel.send !== 'function') {
    throw new Error('Invalid channel: no send() method');
  }

  const payload: any = { embeds: [opts], ...sendOptions };

  if (sendOptions.content !== undefined) {
    if (typeof sendOptions.content !== 'string') {
      throw new Error('sendOptions.content must be a string');
    }
    payload.content = sendOptions.content;
  }

  return channel.send(payload);
}