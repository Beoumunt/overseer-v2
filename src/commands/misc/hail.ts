import { SlashCommandBuilder } from 'discord.js';

export const definition = new SlashCommandBuilder()
  .setName('hail')
  .setDescription('Wywołuje powitanie');

export const name = definition.name;

export async function execute() {
  // TODO: implementacja komendy hail
}
