import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')

  app.enableCors({
    origin: [
      'http://localhost:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean) as string[],
    credentials: true,
  })

  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }))

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DecideKit API')
    .setDescription('AI Commerce Decision Platform')
    .setVersion('1.0')
    .addTag('builder').addTag('dupe').addTag('battles')
    .addTag('catalog').addTag('affiliate').addTag('admin').addTag('ingestion')
    .build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  logger.log(`🚀 API → http://localhost:${port}/api`)
  logger.log(`📖 Docs → http://localhost:${port}/docs`)
}

bootstrap()
