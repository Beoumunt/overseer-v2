import { z } from 'zod';

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, "Brak tokenu Discorda"),
  MONGO_URI: z.string().url("Niepoprawny format MONGO_URI"),
  PORT: z.coerce.number().default(3000),

  GUILD_MAIN_ID: z.string().optional(),
  GUILD_RECRUITMENT_ID: z.string().optional(),
  GUILD_EMBASSY_ID: z.string().optional(),
  GUILD_MARKET_ID: z.string().optional(),
});

export const env = envSchema.parse(Bun.env);