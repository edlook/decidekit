export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3001', 10),
    apiUrl: process.env.API_URL ?? 'http://localhost:3001',
  },
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    name: process.env.DB_NAME ?? 'decidekitdb',
    user: process.env.DB_USER ?? 'postgres',
    pass: process.env.DB_PASS ?? 'password',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  opensearch: {
    url: process.env.OPENSEARCH_URL ?? 'http://localhost:9200',
    indexProducts: process.env.OPENSEARCH_INDEX_PRODUCTS ?? 'products',
  },
  ai: {
    provider: (process.env.AI_PROVIDER ?? 'openai') as 'openai' | 'anthropic',
    openaiKey: process.env.OPENAI_API_KEY,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    modelIntent: process.env.AI_MODEL_INTENT ?? 'gpt-4o-mini',
    modelResult: process.env.AI_MODEL_RESULT ?? 'gpt-4o',
  },
  affiliate: {
    awinKey: process.env.AWIN_API_KEY,
    awinAdvertiserIds: process.env.AWIN_ADVERTISER_IDS?.split(',') ?? [],
    rakutenToken: process.env.RAKUTEN_TOKEN,
    impactSid: process.env.IMPACT_ACCOUNT_SID,
    impactToken: process.env.IMPACT_AUTH_TOKEN,
  },
  posthog: {
    apiKey: process.env.POSTHOG_API_KEY,
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me',
    expiry: process.env.JWT_EXPIRY ?? '7d',
  },
})
