import {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type Client
} from 'discord.js';
import { GuildConfigModel } from '../../db/models/GuildConfig';
import { getServerId } from '../../utils/membership';
import { getChannelFromClient } from '../../utils/discord';
import { banEmbed } from '../../utils/embedConfig/embeds';
import { markClusterBan } from '../../events/clusterBanState';
import { logger } from '../../lib/logger';

export const definition = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Banuje użytkownika na wszystkich serwerach klastra Dark Star')
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Użytkownik do zbanowania')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Powód bana')
      .setRequired(true)
  );

export const name = definition.name;

type ClusterGuild = {
  id: string;
  name: string;
};

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  const mainGuildId = getServerId('main');
  if (!mainGuildId || interaction.guildId !== mainGuildId) {
    await interaction.reply({
      content: 'Ta komenda może być używana tylko na serwerze głównym.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const target = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason', true);

  if (target.id === interaction.user.id) {
    await interaction.reply({
      content: 'Nie możesz zbanować samego siebie.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const guildConfig = await GuildConfigModel.findOne({ guildId: mainGuildId }).lean();
  const bansChannelId = guildConfig?.channels?.bans;
  const bansChannel = await getChannelFromClient(client, mainGuildId, bansChannelId);

  if (!bansChannel || bansChannel.isDMBased()) {
    await interaction.reply({
      content: 'Brak skonfigurowanego kanału bans na serwerze głównym. Ustaw GUILD_MAIN_BANS_CHANNEL_ID i uruchom seed.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const clusterGuilds: ClusterGuild[] = [
    { id: mainGuildId, name: 'DS Main' },
    { id: getServerId('recruitment') ?? '', name: 'DS Recruitment' },
    { id: getServerId('market') ?? '', name: 'DS Market' },
    { id: getServerId('embassy') ?? '', name: 'DS Embassy' }
  ].filter((guild): guild is ClusterGuild => Boolean(guild.id));

  markClusterBan(target.id);

  const bannedGuilds: string[] = [];
  const failedGuilds: string[] = [];

  for (const clusterGuild of clusterGuilds) {
    try {
      const guild = await client.guilds.fetch(clusterGuild.id);
      await guild.bans.create(target.id, { reason });
      bannedGuilds.push(clusterGuild.name);
    } catch (error) {
      failedGuilds.push(clusterGuild.name);
      logger.error(
        `ban: nie udało się zbanować ${target.tag} na ${clusterGuild.name}: ${String(error)}`
      );
    }
  }

  await bansChannel.send({
    embeds: [banEmbed(target, interaction.user, reason, bannedGuilds)]
  });

  const result = failedGuilds.length === 0
    ? `Użytkownik ${target.tag} został zbanowany na ${bannedGuilds.length} serwerach klastra.`
    : `Użytkownik ${target.tag} został zbanowany na ${bannedGuilds.length} serwerach. Niepowodzenie: ${failedGuilds.join(', ')}.`;

  await interaction.reply({
    content: result,
    flags: MessageFlags.Ephemeral
  });
}
