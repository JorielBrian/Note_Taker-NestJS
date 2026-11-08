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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotebooksController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const uuid_param_pipe_1 = require("../common/uuid-param.pipe");
const notebook_dto_1 = require("./dto/notebook.dto");
const notebooks_service_1 = require("./notebooks.service");
let NotebooksController = class NotebooksController {
    notebooks;
    constructor(notebooks) {
        this.notebooks = notebooks;
    }
    list(userId) {
        return this.notebooks.list(userId);
    }
    create(userId, dto) {
        return this.notebooks.create(userId, dto.name);
    }
    rename(userId, id, dto) {
        return this.notebooks.rename(userId, id, dto.name);
    }
    remove(userId, id) {
        return this.notebooks.remove(userId, id);
    }
};
exports.NotebooksController = NotebooksController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotebooksController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notebook_dto_1.NotebookNameDto]),
    __metadata("design:returntype", void 0)
], NotebooksController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('id', (0, uuid_param_pipe_1.UuidParam)())),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, notebook_dto_1.NotebookNameDto]),
    __metadata("design:returntype", void 0)
], NotebooksController.prototype, "rename", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('id', (0, uuid_param_pipe_1.UuidParam)())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], NotebooksController.prototype, "remove", null);
exports.NotebooksController = NotebooksController = __decorate([
    (0, common_1.Controller)('notebooks'),
    __metadata("design:paramtypes", [notebooks_service_1.NotebooksService])
], NotebooksController);
//# sourceMappingURL=notebooks.controller.js.map