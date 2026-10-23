import appConfig from './app.config.js';
import databaseConfig from './database.config.js';
import jwtConfig from './jwt.config.js';

export { appConfig, databaseConfig, jwtConfig };
export * from './app.config.js';
export * from './database.config.js';
export * from './jwt.config.js';

export const configurations = [appConfig, databaseConfig, jwtConfig];
