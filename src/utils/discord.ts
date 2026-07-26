import { Guild, GuildMember, Role, type TextBasedChannel } from 'discord.js';


export async function getRoleFromMember(member: GuildMember, roleId?: string | null): Promise<Role | null> {
    if (!member || !roleId) return null;
    const guild = member.guild;

    const cached = member.guild.roles.cache.get(roleId);
    if (cached) return cached;

    return await member.guild.roles.fetch(roleId).catch(() => null);
}

export async function getChannelFromMember(member: GuildMember, channelId?: string | null): Promise<TextBasedChannel | null> {
    if (!member || !channelId) return null;
    const guild = member.guild;

    // najpierw cache, potem fetch, bez wyrzucania błędu
    const cachedChannel = guild.channels.cache.get(channelId);

    if (cachedChannel && cachedChannel.isTextBased()) return cachedChannel as TextBasedChannel;

    const fetchedChannel = await member.guild.channels.fetch(channelId).catch(() => null);
    if (!fetchedChannel) return null;

    return fetchedChannel.isTextBased() ? (fetchedChannel as TextBasedChannel) : null;
}

export async function getGuildFromMember(member: GuildMember, guildId?: string | null): Promise<Guild | null> {
    if (!member || !guildId) return null;

    const cached = member.client.guilds.cache.get(guildId);
    if (cached) return cached;

    return await member.client.guilds.fetch(guildId).catch(() => null);
}

export async function getMemberFromGuild(guild: Guild, memberId: string): Promise<GuildMember | null> {
    if (!guild || !memberId) return null;

    const cached = guild.members.cache.get(memberId);
    if (cached) return cached;
    return await guild.members.fetch(memberId).catch(() => null);
}
