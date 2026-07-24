import { GuildMember } from 'discord.js';

async function addRecru(member: GuildMember) {
  // Tutaj w przyszłości dodasz: 
  // 1. Sprawdzenie/stworzenie MemberModel
  // 2. Nadanie roli Candidate z GuildConfig
  console.log(`Logika: Dodano ${member.user.tag} do recru.`);
}

export { addRecru };