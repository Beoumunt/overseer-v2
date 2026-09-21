import { Guild, Role, type Client, type GuildMember, type PartialGuildMember, type TextBasedChannel } from 'discord.js';

export async function getRoleFromClient(
    client: Client,
    guildId?: string | null,
    roleId?: string | null
): Promise<Role | null> {
    if (!client || !guildId || !roleId) return null;

    const guild = client.guilds.cache.get(guildId)
        ?? await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return null;

    const cached = guild.roles.cache.get(roleId);
    if (cached) return cached;

    return await guild.roles.fetch(roleId).catch(() => null);
}

export async function getChannelFromClient(
    client: Client,
    guildId?: string | null,
    channelId?: string | null
): Promise<TextBasedChannel | null> {
    if (!client || !guildId || !channelId) return null;

    const guild = client.guilds.cache.get(guildId)
        ?? await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return null;

    // najpierw cache, potem fetch, bez wyrzucania błędu
    const cachedChannel = guild.channels.cache.get(channelId);

    if (cachedChannel && cachedChannel.isTextBased()) return cachedChannel as TextBasedChannel;

    const fetchedChannel = await guild.channels.fetch(channelId).catch(() => null);
    if (!fetchedChannel) return null;

    return fetchedChannel.isTextBased() ? (fetchedChannel as TextBasedChannel) : null;
}

export async function getGuildFromMember(member: GuildMember | PartialGuildMember, guildId?: string | null): Promise<Guild | null> {
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

export async function fetchGuildMembersWithRetry(
    guild: Guild,
    maxAttempts = 3
) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await guild.members.fetch();
        } catch (error) {
            if (attempt === maxAttempts) throw error;

            const retryMatch = String(error).match(/Retry after ([\d.]+) seconds/i);
            const retryAfterMs = retryMatch
                ? Math.ceil(Number(retryMatch[1]) * 1000) + 250
                : attempt * 3000;

            await new Promise(resolve => setTimeout(resolve, retryAfterMs));
        }
    }

    throw new Error(`Nie udało się pobrać członków gildii ${guild.id}.`);
}
