"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_routes_1 = require("../socket.routes");
const handler_1 = require("../handler");
// dungeon, village
exports.default = {
    dungeonController: ({ line, user }) => __awaiter(void 0, void 0, void 0, function* () {
        const [CMD1, CMD2] = line.trim().toUpperCase().split(' ');
        const commandRouter = {
            LOAD: handler_1.dungeon.getDungeonList,
            목록: handler_1.dungeon.getDungeonList,
            도움말: handler_1.dungeon.help,
            입장: handler_1.dungeon.getDungeonInfo,
            OUT: handler_1.front.signout,
        };
        if (!commandRouter[CMD1]) {
            const result = handler_1.dungeon.wrongCommand(CMD1, user);
            return socket_routes_1.socket.emit('print', result);
        }
        const result = yield commandRouter[CMD1](CMD2, user, socket_routes_1.socket.id);
        if (result.chat)
            socket_routes_1.socket.emit('enterChat', result.field);
        socket_routes_1.socket.emit('print', result);
    }),
    villageController: ({ line, user }) => __awaiter(void 0, void 0, void 0, function* () {
        const [CMD1, CMD2] = line.trim().toUpperCase().split(' ');
        const commandRouter = {
            LOAD: handler_1.dungeon.getDungeonList,
            목록: handler_1.dungeon.getDungeonList,
            도움말: handler_1.dungeon.help,
            입장: handler_1.dungeon.getDungeonInfo,
        };
        if (!commandRouter[CMD1]) {
            const result = handler_1.dungeon.wrongCommand(CMD1, user);
            return socket_routes_1.socket.emit('print', result);
        }
        const result = yield commandRouter[CMD1](CMD2, user);
        if (result.chat)
            socket_routes_1.socket.emit('enterChat', result.field);
        socket_routes_1.socket.emit('print', result);
    }),
};
