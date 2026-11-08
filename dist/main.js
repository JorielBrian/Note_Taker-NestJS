"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const app_setup_1 = require("./app.setup");
const env_1 = require("./config/env");
async function bootstrap() {
    const env = (0, env_1.loadEnv)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bodyParser: false });
    app.useBodyParser('json', { limit: '1mb' });
    (0, app_setup_1.configureApp)(app, {
        trustProxy: Number(process.env.TRUST_PROXY ?? 0),
        webOrigin: env.webOrigin,
    });
    app.enableShutdownHooks();
    await app.listen(process.env.PORT ?? 4000);
    console.log(`API listening on :${env.port}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map