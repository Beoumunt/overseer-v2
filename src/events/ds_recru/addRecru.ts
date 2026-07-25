import { GuildMember } from 'discord.js';
import { logger } from '../../lib/logger';
import { upsertMember, type MembershipsIncoming } from '../../services/memberService';

async function addRecru(member: GuildMember) {
  // Tutaj w przyszłości dodasz: 
  // 1. Sprawdzenie/stworzenie MemberModel
  // 2. Nadanie roli Candidate z GuildConfig
  upsertMember({
    member,
    memberships: {} as MembershipsIncoming,
    mainRoles: []
  });
  

  logger.info(`Dodano ${member.user.tag} do recru.`);
}

export { addRecru };