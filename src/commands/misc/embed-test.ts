import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import {
  mainIntruderEmbed,
  mainWelcomeEmbed,
  mainLeaveEmbed,
  promoteEmbed,
  banEmbed,
  marketIntruderEmbed,
  recruWelcomeEmbed,
  recruLeaveEmbed,
  embassyDSmemberKickEmbed,
  embassyWelcomeEmbed,
  embassyLeaveEmbed,
  warnEmbed,
  warnMultipleEmbed,
  showWarnEmbed
} from '../../utils/embedConfig/embeds';
import type { IWarn } from '../../db/models/Warn';

export const definition = new SlashCommandBuilder()
  .setName('embed-test')
  .setDescription('Wysyła wszystkie embedy testowe');

export const name = definition.name;

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = { user: interaction.user } as Parameters<typeof mainWelcomeEmbed>[0];
  const user = interaction.user;
  const moderator = interaction.user;
  const warn = {
    _id: 'embed-test-warn',
    warnedMemberId: user.id,
    moderatorId: moderator.id,
    description: 'Przykładowy powód warna',
    createdAt: new Date()
  } as unknown as IWarn;

  const embeds = [
    mainIntruderEmbed(member),
    mainWelcomeEmbed(member),
    mainLeaveEmbed(member),
    promoteEmbed(user.id, moderator.id),
    marketIntruderEmbed(member),
    recruWelcomeEmbed(member),
    recruLeaveEmbed(member),
    embassyDSmemberKickEmbed(member),
    embassyWelcomeEmbed(member, interaction.channelId, interaction.channelId, member.guild.roles.everyone.id),
    embassyLeaveEmbed(member),
    warnEmbed(user, moderator, 'Przykładowy powód warna', 1),
    warnMultipleEmbed(user, moderator, 'Przykładowy powód wielu warnów', 2),
    showWarnEmbed(warn),
    banEmbed(
      user,
      moderator,
      'Przykładowy powód bana',
      ['DS Main', 'DS Recruitment', 'DS Market', 'DS Embassy']
    )
  ];

  await interaction.reply({ embeds: embeds.slice(0, 10) });
  await interaction.followUp({ embeds: embeds.slice(10) });
}