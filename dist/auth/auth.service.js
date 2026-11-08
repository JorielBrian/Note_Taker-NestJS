"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const argon2 = __importStar(require("argon2"));
const crypto_1 = require("crypto");
const drizzle_orm_1 = require("drizzle-orm");
const db_module_1 = require("../db/db.module");
const schema_1 = require("../db/schema");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
let AuthService = class AuthService {
    db;
    jwt;
    // Verified against when the email is unknown, so response time doesn't reveal which emails exist.
    dummyHash = argon2.hash((0, crypto_1.randomBytes)(16).toString('hex'));
    constructor(db, jwt) {
        this.db = db;
        this.jwt = jwt;
    }
    async register(username, password) {
        const passwordHash = await argon2.hash(password);
        const [created] = await this.db
            .insert(schema_1.users)
            .values({ username, passwordHash })
            .onConflictDoNothing({ target: schema_1.users.username })
            .returning({ id: schema_1.users.id, username: schema_1.users.username });
        if (!created)
            throw new common_1.ConflictException('This username is already taken');
        return created;
    }
    async login(username, password) {
        const [user] = await this.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username)).limit(1);
        const hash = user?.passwordHash ?? (await this.dummyHash);
        const valid = await argon2.verify(hash, password).catch(() => false);
        if (!user || !valid)
            throw new common_1.UnauthorizedException('Invalid username or password');
        return { id: user.id, username: user.username };
    }
    async findPublicUser(id) {
        const [user] = await this.db
            .select({ id: schema_1.users.id, username: schema_1.users.username })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .limit(1);
        if (!user)
            throw new common_1.UnauthorizedException();
        return user;
    }
    signToken(userId) {
        return this.jwt.signAsync({}, { subject: userId, issuer: jwt_auth_guard_1.JWT_ISSUER, algorithm: 'HS256' });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DB)),
    __metadata("design:paramtypes", [Object, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map