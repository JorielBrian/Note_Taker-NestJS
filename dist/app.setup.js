"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureApp = configureApp;
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
/** Shared by main.ts and the e2e tests so tests exercise the real configuration. */
function configureApp(app, opts = {}) {
    const express = app;
    if (opts.trustProxy)
        express.set('trust proxy', opts.trustProxy);
    app.use((0, helmet_1.default)());
    app.use((0, cookie_parser_1.default)());
    if (opts.webOrigin)
        app.enableCors({ origin: opts.webOrigin, credentials: true });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    return app;
}
//# sourceMappingURL=app.setup.js.map