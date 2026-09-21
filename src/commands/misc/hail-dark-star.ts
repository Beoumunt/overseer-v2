import {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';
import { EMOJI } from '../../utils/embedConfig/emoji';
import { logger } from '../../lib/logger';

export const definition = new SlashCommandBuilder()
  .setName('hail-dark-star')
  .setDescription('Wysyła powitanie Dark Star na bieżący kanał')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export const name = definition.name;

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.channel || !('send' in interaction.channel)) {
    await interaction.reply({
      content: 'Ta komenda wymaga kanału tekstowego.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    await interaction.reply({
      content: 'Powitanie Dark Star zostało wysłane.',
      flags: MessageFlags.Ephemeral
    });

    await interaction.channel.send({
      content: `${EMOJI.AHOJ} ${EMOJI.DS_LOGO}`
    });
  } catch (error) {
    logger.error(
      `hail-dark-star: błąd podczas wysyłania powitania: ${String(error)}`
    );

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Wystąpił błąd podczas wysyłania powitania.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
}
