import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

export const definition = new SlashCommandBuilder()
  .setName('test')
  .setDescription('Sprawdza działanie konfiguracji komend');

export const name = definition.name;

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply('UDANY');
}