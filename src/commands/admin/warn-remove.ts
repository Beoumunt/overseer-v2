import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { Types } from 'mongoose';
import { WarnModel } from '../../db/models/Warn';
import { getServerId } from '../../utils/membership';

export const definition = new SlashCommandBuilder()
  .setName('warn-remove')
  .setDescription('Usuwa wybranego warna użytkownika')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Użytkownik, któremu chcesz usunąć warna')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('warn-id')
      .setDescription('ID warna z komendy warns-show')
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
  const warnId = interaction.options.getString('warn-id', true);

  if (!Types.ObjectId.isValid(warnId)) {
    await interaction.reply({
      content: 'Podano nieprawidłowe ID warna.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const result = await WarnModel.deleteOne({
    _id: new Types.ObjectId(warnId),
    warnedMemberId: user.id
  });

  await interaction.reply({
    content: result.deletedCount === 0
      ? `Nie znaleziono warna o ID ${warnId} dla użytkownika ${user.tag}.`
      : `Usunięto warna o ID ${warnId} użytkownika ${user.tag}.`,
    flags: MessageFlags.Ephemeral
  });
}
