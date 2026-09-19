import type { Client, GuildMember, PartialGuildMember } from 'discord.js';
import { logger } from '../../lib/logger';
import { syncMember } from '../../sync/syncMembers';
import { env } from '../../lib/env';
import { getChannelFromClient, getMemberFromGuild } from '../../utils/discord';
import { sendEmbed } from '../../utils/embedBuilder';
import { mainLeaveEmbed } from '../../utils/embeds';
import { GuildConfigModel } from '../../db/models/GuildConfig';
import { getServerId } from '../../utils/membership';

export async function removeMain(
	member: GuildMember | PartialGuildMember,
	client: Client
) {
	if (member.user.bot) return;

	const guildIds = [
		env.GUILD_RECRUITMENT_ID,
		env.GUILD_MARKET_ID,
		env.GUILD_EMBASSY_ID
	].filter((guildId): guildId is string => Boolean(guildId));

    const mainGuildId = getServerId('main')!;
    const cfg = await GuildConfigModel.findOne({ guildId: mainGuildId }).lean();
	const channel = await getChannelFromClient(client, mainGuildId, cfg!.channels!.welcome!);
    
	if (channel?.isTextBased() && !channel.isDMBased()) {
		await sendEmbed(channel, mainLeaveEmbed(member));
	}

	for (const guildId of guildIds) {
		try {
			const guild = await client.guilds.fetch(guildId);
			if (!guild) {
				logger.warn(`removeMain: nie znaleziono gildii ${guildId} dla ${member.user.tag}`);
				continue;
			}

			const guildMember = await getMemberFromGuild(guild, member.id);
			if (!guildMember) continue;

			await guildMember.kick('Opuścił serwer Dark Star Main');
			logger.info(`removeMain: usunięto ${member.user.tag} (${member.id}) z gildii ${guildId}`);
		} catch (error) {
			logger.error(
				`removeMain: błąd podczas usuwania ${member.user.tag} (${member.id}) z gildii ${guildId}: ${String(error)}`
			);
		}
	}

	try {
		await syncMember(member);
	} catch (error) {
		logger.error(`removeMain: błąd synchronizacji ${member.user.tag} (${member.id}): ${String(error)}`);
	}
}