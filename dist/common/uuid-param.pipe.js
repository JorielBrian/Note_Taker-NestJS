"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UuidParam = void 0;
const common_1 = require("@nestjs/common");
// Malformed ids answer 404 like unknown ids, so the API reveals nothing about what exists.
const UuidParam = () => new common_1.ParseUUIDPipe({ errorHttpStatusCode: 404 });
exports.UuidParam = UuidParam;
//# sourceMappingURL=uuid-param.pipe.js.map