import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import {
  mainIntruderEmbed,
  mainWelcomeEmbed,
  mainLeaveEmbed,
  promoteEmbed,
  marketIntruderEmbed,
  recruWelcomeEmbed,
  recruLeaveEmbed,
  warnEmbed,
  warnMultipleEmbed,
  showWarnEmbed
} from '../../utils/embeds';
import type { IWarn } from '../../db/models/Warn';

export const definition = new SlashCommandBuilder()
  .setName('embed-test')
  .setDescription('Wysyła wszystkie embedy testowe');

export const name = definition.name;

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = { user: { username: 'Embed Test' } } as Parameters<typeof mainWelcomeEmbed>[0];
  const user = { id: '000000000000000001', tag: 'Embed Test#0001' };
  const moderator = { id: '000000000000000002', tag: 'Moderator#0002' };
  const warn = {
    _id: 'embed-test-warn',
    warnedMemberId: user.id,
    moderatorId: moderator.id,
    description: 'Przykładowy powód warna',
    createdAt: new Date()
  } as unknown as IWarn;

  await interaction.reply({
    embeds: [
      mainIntruderEmbed(member),
      mainWelcomeEmbed(member),
      mainLeaveEmbed(member),
      promoteEmbed(member),
      marketIntruderEmbed(member),
      recruWelcomeEmbed(member),
      recruLeaveEmbed(member),
      warnEmbed(user, moderator, 'Przykładowy powód warna', 1),
      warnMultipleEmbed(user, moderator, 'Przykładowy powód wielu warnów', 2),
      showWarnEmbed(warn)
    ]
  });
}