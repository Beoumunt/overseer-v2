import {
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type Client
} from 'discord.js';
import { updateAllMemberCounters } from '../../services/memberCounters/memberCounterService';

export const definition = new SlashCommandBuilder()
  .setName('update-member-counters')
  .setDescription('Aktualizuje wszystkie kanały liczników w klastrze Dark Star');

export const name = definition.name;

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const result = await updateAllMemberCounters(client);

  await interaction.editReply({
    content: [
      `Zaktualizowano: ${result.updated}`,
      `Pominięto: ${result.skipped}`,
      `Błędy: ${result.failed}`
    ].join('\n')
  });
}
