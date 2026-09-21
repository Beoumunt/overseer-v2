export function memberCounterChannelName(roleName: string, memberCount: number) {
  const safeRoleName = roleName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'role';

  return `📊${safeRoleName}-${memberCount}`;
}
