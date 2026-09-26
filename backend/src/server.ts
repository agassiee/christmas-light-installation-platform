import { app } from './app';
import { env } from './config/env';
import { initPgBoss } from './lib/pg-boss';
import { initNotificationWorker } from './modules/notifications/notification.worker';

const start = async () => {
  await initPgBoss();
  await initNotificationWorker();
  
  app.listen(env.PORT, () => {
    console.log(`Server started on port ${env.PORT}`);
  });
};

start();
