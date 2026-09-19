import type { GuildMember, PartialGuildMember } from 'discord.js';
import { logger } from '../../lib/logger';
import { syncMember } from '../../sync/syncMembers';

export async function removeMarket(member: GuildMember | PartialGuildMember) {
	if (member.user.bot) return;

	try {
		await syncMember(member);
		logger.info(`removeMarket: zsynchronizowano opuszczenie marketu przez ${member.user.tag} (${member.id})`);
	} catch (error) {
		logger.error(`removeMarket: błąd podczas synchronizacji opuszczenia marketu przez ${member.user.tag} (${member.id}): ${String(error)}`);
	}
}