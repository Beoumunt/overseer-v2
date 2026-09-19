import { z } from 'zod';

const mongoUriRegex = /^mongodb(\+srv)?:\/\/.+/;

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, "Brak tokenu Discorda"),
  CLIENT_ID: z.string().min(1, "Brak CLIENT_ID aplikacji Discord"),
  MONGO_URI: z.string().regex(
    mongoUriRegex,
    "Niepoprawny format MONGO_URI. Powinien zaczynać się od mongodb:// lub mongodb+srv://"
  ),
  PORT: z.coerce.number().default(3000),

  GUILD_MAIN_ID: z.string().optional(),
  GUILD_RECRUITMENT_ID: z.string().optional(),
  GUILD_EMBASSY_ID: z.string().optional(),
  GUILD_MARKET_ID: z.string().optional(),
});

export const env = envSchema.parse(Bun.env);