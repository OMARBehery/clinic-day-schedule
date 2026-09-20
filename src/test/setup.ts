import { config } from "dotenv";

config({ path: ".env", quiet: true });
config({ path: ".env.local", override: true, quiet: true });

process.env.CLINIC_TIMEZONE ??= "Africa/Cairo";
process.env.NEXT_PUBLIC_CLINIC_TIMEZONE ??= "Africa/Cairo";
