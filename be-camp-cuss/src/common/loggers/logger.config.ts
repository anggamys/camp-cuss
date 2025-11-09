import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { format, transports } from 'winston';

export const createWinstonConfig = () => ({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        nestWinstonModuleUtilities.format.nestLike('App', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
    ...(process.env.LOG_TO_FILE === 'true'
      ? [
          new transports.File({
            filename: 'logs/app.log',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
            tailable: true,
          }),
        ]
      : []),
  ],
});
