import { GuildMember } from 'discord.js';
import { mainIntruderEmbed, mainWelcomeEmbed } from '../../utils/embeds';
import { GuildConfigModel } from '../../db/models/GuildConfig';
import { logger } from '../../lib/logger';
import { syncMember } from '../../sync/syncMembers';
import { memberHasRole } from '../../utils/dbRoles';
import { getServerId } from '../../utils/membership';
import { sendEmbed } from '../../utils/embedBuilder';
import { getChannelFromMember, getGuildFromMember, getMemberFromGuild, getRoleFromMember } from '../../utils/discord';

export async function addMain(member: GuildMember) {
    if (member.user.bot) return;


    if (!await memberHasRole(member, ['recruit'], 'all')) {
        sendEmbed(member, mainIntruderEmbed(member));
        member.kick('Nie przeszedł rekrutacji, nie może przebywać na tym discordzie').catch(() => {});
        logger.info(`addMain: wyrzucono ${member.user.tag} (${member.id}) z ds_main, ponieważ nie posiada rangi recruit w bazie danych`);
        return;
    }

    const mainGuildId = getServerId('main');
    const cfg = await GuildConfigModel.findOne({ guildId: mainGuildId }).lean();
    const recruitRoleId = cfg?.roles?.recruit;

    if (!recruitRoleId) {
        logger.warn(`addMain: brak roli recruit w GuildConfig dla ds_main!`);
        return;
    }

    // Pobieramy obiekt roli z cache lub fetchujemy go, jeśli nie jest dostępny w cache
    const role = await getRoleFromMember(member, recruitRoleId);
    if (!role) {
        logger.warn(`addMain: nie znaleziono roli recruit ${recruitRoleId} w ds_main!`);
        return;
    }

    await member.roles.add(role);
    logger.info(`addMain: nadano rolę recruit ${role.name} (${role.id}) dla ${member.user.tag} w ds_main!`);
    // Synchronizacja uzytkownika z bazą danych
    await syncMember(member);

    // Wysłanie wiadomości na kanał o tym, że użytkownik przeszedł rekrtutację i dołączył do ds main
    const welcomeChannelId = cfg?.channels?.welcome;
    
    if (!welcomeChannelId) {
        return;
    } else {
        const channel = await getChannelFromMember(member, welcomeChannelId);
        if (!channel || !channel.isTextBased() || channel.isDMBased()) {
            logger.warn(`addMain: nie znaleziono kanału powitalnego ${welcomeChannelId} w ds_main.`);
            return;
        }
        sendEmbed(channel, mainWelcomeEmbed(member));
    }

    // Usunięcie użytkownika z serwera rekrutacyjnego
    const recruitmentGuildId = getServerId('recruitment');
    if (!recruitmentGuildId) {
        logger.warn(`addMain: brak ID serwera rekrutacyjnego!`);
        return;
    }

    const recruitmentGuild = await getGuildFromMember(member, recruitmentGuildId);

    if (recruitmentGuild) {
        const recruitmentMember = await getMemberFromGuild(recruitmentGuild, member.id);
        if (recruitmentMember) {
            recruitmentMember.kick('Przeszedł rekrutację i dołączył do ds_main').catch(() => {});
            logger.info(`addMain: usunięto ${member.user.tag} (${member.id}) z ds_recruitment po dołączeniu do ds_main`);
        }
    }

    // Synchronizacja uzytkownika z bazą danych
    await syncMember(member);
}