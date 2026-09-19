import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { WarnModel } from '../../db/models/Warn';
import { getServerId } from '../../utils/membership';

export const definition = new SlashCommandBuilder()
  .setName('warns-clear')
  .setDescription('Usuwa wszystkie warny wybranego użytkownika')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Użytkownik, któremu chcesz usunąć warny')
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
  const result = await WarnModel.deleteMany({ warnedMemberId: user.id });

  await interaction.reply({
    content: result.deletedCount === 0
      ? `Użytkownik ${user.tag} nie miał żadnych warnów do usunięcia.`
      : `Usunięto ${result.deletedCount} warn(ów) użytkownika ${user.tag}.`,
    flags: MessageFlags.Ephemeral
  });
}
