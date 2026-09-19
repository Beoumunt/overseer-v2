import type { Client, GuildMember, PartialGuildMember } from 'discord.js';
import { GuildConfigModel } from '../../db/models/GuildConfig';
import { MemberModel } from '../../db/models/Member';
import { logger } from '../../lib/logger';
import { syncMember } from '../../sync/syncMembers';
import { recruLeaveEmbed } from '../../utils/embeds';
import { getChannelFromClient } from '../../utils/discord';
import { getServerId } from '../../utils/membership';

export async function removeRecru(
	member: GuildMember | PartialGuildMember,
	client: Client
) {
	if (member.user.bot) return;

	const recruitmentGuildId = getServerId('recruitment');
	const mainGuildId = getServerId('main');

	try {
		const memberRecord = await MemberModel.findOne({ discordId: member.id }).lean().exec();
		const memberships = memberRecord?.memberships as unknown as
			Record<string, { isPresent?: boolean }> | undefined;
		const recruitmentMembership = recruitmentGuildId ? memberships?.[recruitmentGuildId] : undefined;
		const mainMembership = mainGuildId ? memberships?.[mainGuildId] : undefined;

		const wasRecruitmentMember = recruitmentMembership?.isPresent === true;
		const isPromotionToMain = mainMembership?.isPresent === true;

		if (wasRecruitmentMember && !isPromotionToMain) {
			const cfg = await GuildConfigModel.findOne({ guildId: recruitmentGuildId }).lean().exec();
			const leaveChannelId = cfg?.channels?.welcome;
			const channel = await getChannelFromClient(client, recruitmentGuildId, leaveChannelId);

			if (channel && !channel.isDMBased()) {
				await channel.send({ embeds: [recruLeaveEmbed(member)] });
			}
		}
	} catch (error) {
		logger.error(
			`removeRecru: błąd podczas obsługi opuszczenia Recruitment przez ${member.user.tag} (${member.id}): ${String(error)}`
		);
	} finally {
		try {
			await syncMember(member);
		} catch (error) {
			logger.error(
				`removeRecru: błąd synchronizacji ${member.user.tag} (${member.id}): ${String(error)}`
			);
		}
	}
}