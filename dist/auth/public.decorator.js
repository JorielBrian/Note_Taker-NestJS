"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Public = exports.IS_PUBLIC = void 0;
const common_1 = require("@nestjs/common");
exports.IS_PUBLIC = 'isPublic';
/** Routes are protected by default (deny-by-default); mark exceptions with @Public(). */
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC, true);
exports.Public = Public;
//# sourceMappingURL=public.decorator.js.map