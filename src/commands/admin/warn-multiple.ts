import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { MemberModel } from '../../db/models/Member';
import { WarnModel } from '../../db/models/Warn';
import { getServerId } from '../../utils/membership';
import { warnMultipleEmbed } from '../../utils/embeds';

export const definition = new SlashCommandBuilder()
  .setName('warn-multiple')
  .setDescription('Nadaj warna wielu użytkownikom po ID')
  .addStringOption(option =>
    option
      .setName('ids')
      .setDescription('ID użytkowników oddzielone przecinkiem lub średnikiem')
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

  const ids = [...new Set(
    interaction.options
      .getString('ids', true)
      .split(/[,;]/)
      .map(id => id.trim())
      .filter(Boolean)
  )];
  const reason = interaction.options.getString('reason', true);

  if (ids.length === 0) {
    await interaction.reply({
      content: 'Nie podano żadnych ID.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const members = await MemberModel.find({ discordId: { $in: ids } }).lean();
  const foundIds = new Set(members.map(member => member.discordId));
  const failed = ids.filter(id => !foundIds.has(id));
  const embeds = [];

  for (const member of members) {
    await WarnModel.create({
      warnedMemberId: member.discordId,
      moderatorId: interaction.user.id,
      description: reason
    });

    const warnCount = await WarnModel.countDocuments({
      warnedMemberId: member.discordId
    });

    embeds.push(warnMultipleEmbed(
      { id: member.discordId, tag: member.username },
      interaction.user,
      reason,
      warnCount
    ));
  }

  await interaction.reply({
    content: `Warnowanie zakończone. Zwarnowano: ${members.length}.`,
    flags: MessageFlags.Ephemeral
  });

  for (let index = 0; index < embeds.length; index += 10) {
    await interaction.followUp({ embeds: embeds.slice(index, index + 10) });
  }

  if (failed.length > 0) {
    await interaction.followUp({
      content: `Nie znaleziono w bazie: ${failed.join(', ')}`,
      flags: MessageFlags.Ephemeral
    });
  }
}
