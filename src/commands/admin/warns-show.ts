import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { WarnModel } from '../../db/models/Warn';
import { getServerId } from '../../utils/membership';
import { showWarnEmbed } from '../../utils/embeds';

export const definition = new SlashCommandBuilder()
  .setName('warns-show')
  .setDescription('Wyświetla wszystkie warny użytkownika')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Użytkownik, którego warny chcesz zobaczyć')
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
  const warns = await WarnModel.find({ warnedMemberId: user.id })
    .sort({ createdAt: 1 })
    .exec();

  if (warns.length === 0) {
    await interaction.reply({
      content: `Użytkownik ${user.tag} nie ma żadnych warnów.`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await interaction.reply({
    content: `Warny użytkownika ${user.tag}:`,
    flags: MessageFlags.Ephemeral
  });

  for (let index = 0; index < warns.length; index += 10) {
    await interaction.followUp({
      embeds: warns.slice(index, index + 10).map(showWarnEmbed),
      flags: MessageFlags.Ephemeral
    });
  }
}
