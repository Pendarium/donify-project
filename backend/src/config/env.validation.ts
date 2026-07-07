type EnvShape = {
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
  PORT?: string;
  NODE_ENV?: string;
};

export function validateEnv(config: EnvShape) {
  const errors: string[] = [];

  if (!config.DATABASE_URL?.trim()) {
    errors.push('DATABASE_URL is required.');
  }

  if (!config.JWT_SECRET?.trim()) {
    errors.push('JWT_SECRET is required.');
  } else if (config.JWT_SECRET.length < 12) {
    errors.push('JWT_SECRET must contain at least 12 characters.');
  }

  if (config.PORT && Number.isNaN(Number(config.PORT))) {
    errors.push('PORT must be a number.');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.join(' ')}`);
  }

  return {
    ...config,
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN || '1h',
  };
}
