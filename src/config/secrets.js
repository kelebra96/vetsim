import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

function getSecret(name, developmentFallback) {
  const value = process.env[name];
  if (value && value.trim().length > 0) return value;

  if (isProduction) {
    throw new Error(`${name} must be configured in production.`);
  }

  console.warn(`${name} is not configured. Using an insecure development fallback.`);
  return developmentFallback;
}

export const jwtSecret = getSecret("JWT_SECRET", "dev-jwt-secret-change-me");
export const sessionSecret = getSecret("SESSION_SECRET", jwtSecret);
