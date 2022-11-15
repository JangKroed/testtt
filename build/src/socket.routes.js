"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socket = void 0;
const cache_1 = require("./db/cache");
const controller_1 = require("./controller");
const onConnection = (server) => {
    console.log('SOCKET CONNECTED');
    exports.socket = server;
    /************************************************************************
                                    홈
     ************************************************************************/
    server.on('none', controller_1.home.noneController);
    server.on('front', controller_1.home.frontController);
    server.on('sign', controller_1.home.signController);
    /************************************************************************
                                    필드
     ************************************************************************/
    server.on('dungeon', controller_1.field.dungeonController);
    server.on('village', controller_1.field.villageController);
    /************************************************************************
                                    전투
     ************************************************************************/
    server.on('battle', controller_1.battle.battleController);
    server.on('encounter', controller_1.battle.encounterController);
    server.on('action', controller_1.battle.actionController);
    server.on('autoBattle', controller_1.battle.autoBattleController);
    /************************************************************************
                                   모험 종료
     ************************************************************************/
    server.on('adventureResult', controller_1.battle.resultController);
    /************************************************************************
                                    채팅박스
     ************************************************************************/
    server.on('submit', controller_1.chat.chatController);
    server.on('disconnect', () => {
        cache_1.redis.del(server.id);
        console.log(server.id, 'SOCKET DISCONNECTED');
    });
};
exports.default = onConnection;
