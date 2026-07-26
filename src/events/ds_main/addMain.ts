import { GuildMember } from 'discord.js';
import { mainIntruderEmbed, mainWelcomeEmbed } from '../../utils/embeds';
import { GuildConfigModel } from '../../db/models/GuildConfig';
import { logger } from '../../lib/logger';
import { syncMember } from '../../sync/syncMembers';
import { memberHasRole } from '../../utils/dbRoles';
import { getServerId } from '../../utils/membership';
import { sendEmbed } from '../../utils/embedBuilder';

export async function addMain(member: GuildMember) {
    if (member.user.bot) return;


    if (!await memberHasRole(member, ['recruit'], 'all')) {
        sendEmbed(member, mainIntruderEmbed(member));
        member.kick('Nie przeszedł rekrutacji, nie może przebywać na tym discordzie').catch(() => {});
        logger.info(`addMain: wyrzucono ${member.user.tag} (${member.id}) z main, ponieważ nie posiada rangi recruit w bazie danych`);
        return;
    }

    const mainGuildId = getServerId('main');
    const cfg = await GuildConfigModel.findOne({ guildId: mainGuildId }).lean();
    const recruitRoleId = cfg?.roles?.recruit;

    if (!recruitRoleId) {
        logger.warn(`addMain: brak roli recruit w GuildConfig dla guild ${member.guild.id} - ${mainGuildId}`);
        return;
    }

    // Pobieramy obiekt roli z cache lub fetchujemy go, jeśli nie jest dostępny w cache
    const role = member.guild.roles.cache.get(recruitRoleId) ?? await member.guild.roles.fetch(recruitRoleId).catch(() => null);
    if (!role) {
        logger.warn(`addMain: nie znaleziono roli recruit ${recruitRoleId} w guild ${member.guild.id}`);
        return;
    }

    await member.roles.add(role);
    logger.info(`addMain: nadano rolę recruit ${role.name} (${role.id}) dla ${member.user.tag} w guild ${member.guild.id}`);
    // Synchronizacja uzytkownika z bazą danych
    await syncMember(member);

    // Wysłanie wiadomości na kanał o tym, że użytkownik przeszedł rekrtutację i dołączył do ds main
    const welcomeChannelId = cfg?.channels?.welcome;
    
    if (!welcomeChannelId) {
        return;
    } else {
        const channel = member.guild.channels.cache.get(welcomeChannelId) ?? await member.guild.channels.fetch(welcomeChannelId).catch(() => null);
        if (!channel || !channel.isTextBased()) {
            return;
        }
        sendEmbed(channel, mainWelcomeEmbed(member));
    }

    // Usunięcie użytkownika z serwera rekrutacyjnego
    const recruitmentGuildId = getServerId('recruitment');
    if (!recruitmentGuildId) {
        return;
    }
    const recruitmentGuild = member.client.guilds.cache.get(recruitmentGuildId) ?? await member.client.guilds.fetch(recruitmentGuildId).catch(() => null);

    if (recruitmentGuild) {
        const recruitmentMember = recruitmentGuild.members.cache.get(member.id) ?? await recruitmentGuild.members.fetch(member.id).catch(() => null);
        if (recruitmentMember) {
            recruitmentMember.kick('Przeszedł rekrutację i dołączył do DS Main').catch(() => {});
            logger.info(`addMain: usunięto ${member.user.tag} (${member.id}) z ds_recru po dołączeniu do ds_main`);
        }
    }

    // Synchronizacja uzytkownika z bazą danych
    await syncMember(member);


    /*
    ✅addMain
    ✅      - trzeba sprawdzić czy osoba posiada w bazie danych rangę Rekrut 
    ✅          - jeśli nie to wiadomość, że nie ta osoba nie przeszłą rekrutacji i należy przejsć na ten dc:
    ✅      - następnie trzeba nadać rangi i po nadaniu tych rang usunąć tą osobę z ds_recru
    ✅      - syncMember
    ✅      - wiadomość na kanale, że osoba przeszła rekrutacje


    */
}