import { z } from 'zod';

const mongoUriRegex = /^mongodb(\+srv)?:\/\/.+/;
const discordIdRegex = /^\d+$/;

const requiredDiscordId = z.string().regex(
  discordIdRegex,
  'ID Discorda musi zawierać wyłącznie cyfry'
);

// Puste opcjonalne wpisy z .env traktujemy tak samo jak brak zmiennej.
const optionalDiscordId = z.preprocess(
  value => value === '' ? undefined : value,
  requiredDiscordId.optional()
);

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, "Brak tokenu Discorda"),
  CLIENT_ID: z.string().min(1, "Brak CLIENT_ID aplikacji Discord"),
  MONGO_URI: z.string().regex(
    mongoUriRegex,
    "Niepoprawny format MONGO_URI. Powinien zaczynać się od mongodb:// lub mongodb+srv://"
  ),
  PORT: z.coerce.number().default(3000),

  GUILD_MAIN_ID: requiredDiscordId,
  GUILD_RECRUITMENT_ID: requiredDiscordId,
  GUILD_EMBASSY_ID: requiredDiscordId,
  GUILD_MARKET_ID: requiredDiscordId,

  // DS Main: pełny zestaw skonfigurowanych ról i kanałów środowiska.
  GUILD_MAIN_ROLE_CANDIDATE_ID: optionalDiscordId,
  GUILD_MAIN_ROLE_RECRUIT_ID: requiredDiscordId,
  GUILD_MAIN_ROLE_GUEST_ID: requiredDiscordId,
  GUILD_MAIN_ROLE_DARK_STAR_ID: requiredDiscordId,
  GUILD_MAIN_ROLE_ENLISTER_ID: requiredDiscordId,
  GUILD_MAIN_ROLE_DIPLOMAT_ID: requiredDiscordId,
  GUILD_MAIN_ROLE_AMBASSADOR_ID: requiredDiscordId,
  GUILD_MAIN_ROLE_OFFICER_ID: requiredDiscordId,
  GUILD_MAIN_ROLE_LICHE_ID: requiredDiscordId,
  GUILD_MAIN_ROLE_EMPEROR_ID: requiredDiscordId,
  GUILD_MAIN_CHANNEL_WELCOME_ID: requiredDiscordId,
  GUILD_MAIN_CHANNEL_BANS_ID: requiredDiscordId,
  GUILD_MAIN_CHANNEL_NOTE_ID: requiredDiscordId,
  GUILD_MAIN_CHANNEL_NEWS_ID: requiredDiscordId,

  // DS Recruitment: tylko role i kanał używane przez przepływ rekrutacji.
  GUILD_RECRUITMENT_ROLE_CANDIDATE_ID: requiredDiscordId,
  GUILD_RECRUITMENT_ROLE_RECRUIT_ID: requiredDiscordId,
  GUILD_RECRUITMENT_ROLE_ENLISTER_ID: requiredDiscordId,
  GUILD_RECRUITMENT_CHANNEL_WELCOME_ID: requiredDiscordId,

  // DS Market: rola sprawdzana przy wejściu na serwer.
  GUILD_MARKET_ROLE_DARK_STAR_ID: optionalDiscordId,

  // DS Embassy: role opiekuna i ambasadora oraz kanał logów wyjścia.
  GUILD_EMBASSY_ROLE_DIPLOMAT_ID: optionalDiscordId,
  GUILD_EMBASSY_ROLE_AMBASSADOR_ID: optionalDiscordId,
  GUILD_EMBASSY_CHANNEL_WELCOME_ID: optionalDiscordId,
});

export const env = envSchema.parse(Bun.env);