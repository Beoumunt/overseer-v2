import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { WarnModel } from '../../db/models/Warn';
import { getServerId } from '../../utils/membership';
import { warnEmbed } from '../../utils/embeds';

export const definition = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Nadaj warna użytkownikowi')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Użytkownik do zwarnowania')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Powód warna')
      .setRequired(true)
  );

export const name = definition.name;

export async function execute(interaction: ChatInputCommandInteraction) {
  if (interaction.guildId !== getServerId('main')) {
    await interaction.reply({
      content: 'Ta komenda może być używana tylko na serwerze głównym.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason', true);

  await WarnModel.create({
    warnedMemberId: user.id,
    moderatorId: interaction.user.id,
    description: reason
  });

  const warnCount = await WarnModel.countDocuments({ warnedMemberId: user.id });
  await interaction.reply({
    embeds: [warnEmbed(user, interaction.user, reason, warnCount)]
  });
}
