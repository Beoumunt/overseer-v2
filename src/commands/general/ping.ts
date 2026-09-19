import {
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';

export const definition = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Sprawdza pong bota');

export const name = definition.name;

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: 'Pong!',
    flags: MessageFlags.Ephemeral
  });
}
