"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = exports.JWT_ISSUER = exports.AUTH_COOKIE = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const public_decorator_1 = require("./public.decorator");
exports.AUTH_COOKIE = 'access_token';
exports.JWT_ISSUER = 'note-taker';
let JwtAuthGuard = class JwtAuthGuard {
    jwt;
    reflector;
    constructor(jwt, reflector) {
        this.jwt = jwt;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const req = context.switchToHttp().getRequest();
        const token = req.cookies?.[exports.AUTH_COOKIE];
        if (typeof token !== 'string' || !token)
            throw new common_1.UnauthorizedException();
        try {
            const payload = await this.jwt.verifyAsync(token, {
                algorithms: ['HS256'],
                issuer: exports.JWT_ISSUER,
            });
            if (!payload.sub)
                throw new Error('missing subject');
            req.user = { id: payload.sub };
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException();
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        core_1.Reflector])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map