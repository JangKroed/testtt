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
const socket_routes_1 = require("../../socket.routes");
const services_1 = require("../../services");
const cache_1 = require("../../db/cache");
const handler_1 = require("../../handler");
class BattleAction {
    constructor() {
        this.attack = (CMD, user) => __awaiter(this, void 0, void 0, function* () {
            const whoIsDead = {
                // back to dungeon list when player died
                player: handler_1.dungeon.getDungeonList,
                // back to encounter phase when monster died
                monster: handler_1.battle.reEncounter,
            };
            const characterId = user.characterId.toString();
            const autoAttackId = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                cache_1.battleCache.set(characterId, { autoAttackId });
                const { script, field, user: newUser, error } = yield handler_1.battle.autoAttack(CMD, user);
                if (error)
                    return;
                socket_routes_1.socket.emit('printBattle', { script, field, user: newUser });
                // const { dead } = battleCache.get(characterId);
                const { dead } = yield cache_1.redis.hGetAll(characterId);
                // dead = 'moster'|'player'|undefined
                if (dead) {
                    cache_1.redis.hDelResetCache(characterId);
                    const { autoAttackId } = cache_1.battleCache.get(characterId);
                    clearInterval(autoAttackId);
                    cache_1.battleCache.delete(characterId);
                    const result = yield whoIsDead[dead]('', newUser);
                    socket_routes_1.socket.emit('print', result);
                    return;
                }
            }), 1500);
            return { script: '', user, field: 'action', cooldown: Date.now() - 2000 };
        });
        this.actionSkill = (CMD, user) => __awaiter(this, void 0, void 0, function* () {
            let tempScript = '';
            let field = 'action';
            const { characterId } = user;
            // ?????? ?????? ????????????
            const { attack, mp, skill } = yield services_1.CharacterService.findByPk(characterId);
            if (skill[Number(CMD) - 1] === undefined) {
                const result = handler_1.battle.battleHelp(CMD, user);
                return {
                    script: result.script,
                    user: result.user,
                    field: result.field,
                    error: true
                };
            }
            const { name: skillName, cost, multiple } = skill[Number(CMD) - 1];
            // ????????? ?????? ????????????
            const { monsterId } = yield cache_1.redis.hGetAll(characterId);
            // const { monsterId } = battleCache.get(characterId);
            const monster = yield services_1.MonsterService.findByPk(monsterId);
            if (!monster)
                throw new Error('????????? ????????? ????????????.');
            /**
             * ????????? ?????? ????????? ????????? ?????? ?????? ????????? ?????? ???????????? ??????
             * ?????? ??????/?????? ?????? ???????
             */
            const { name: monsterName, hp: monsterHp, exp: monsterExp } = monster;
            // ?????? ????????? ??????
            if (mp - cost < 0) {
                tempScript += `??? : ???????????? ????????????.\n`;
                const script = tempScript;
                return { script, user, field };
            }
            // ?????? ????????? ??????
            const playerSkillDamage = Math.floor((attack * multiple) / 100);
            const realDamage = services_1.BattleService.hitStrength(playerSkillDamage);
            // ?????? Cost ??????
            user = yield services_1.CharacterService.refreshStatus(characterId, 0, cost, monsterId);
            tempScript += `\n????????? ${skillName} ????????? ${monsterName}?????? ??????! => ${realDamage}??? ?????????!\n`;
            // ??????????????? ?????? ????????? ?????? 
            const isDead = yield services_1.MonsterService.refreshStatus(monsterId, realDamage, characterId);
            if (!isDead)
                throw new Error('????????? ????????? ?????? ??? ????????????');
            if (isDead === 'dead') {
                // battleCache.set(characterId, { dead: 'monster' });
                yield cache_1.redis.hSet(characterId, { dead: 'monster' });
                return yield handler_1.battle.resultMonsterDead(monster, tempScript);
            }
            // isDead === 'alive'
            const script = tempScript;
            return { script, user, field };
        });
        this.autoBattleSkill = (user) => __awaiter(this, void 0, void 0, function* () {
            const { characterId, mp } = user;
            let field = 'autoBattle';
            let tempScript = '';
            // ?????? ?????? ???????????? & ????????? ?????? ?????? (cost ????????? ??????)
            const { attack, skill } = yield services_1.CharacterService.findByPk(characterId);
            const selectedSkill = handler_1.battle.skillSelector(skill);
            const { name: skillName, cost: skillCost, multiple } = selectedSkill;
            // ????????? ?????? ????????????
            const { monsterId } = yield cache_1.redis.hGetAll(characterId);
            const monster = yield services_1.MonsterService.findByPk(monsterId);
            if (!monster)
                throw new Error('????????? ????????? ????????????.');
            const { name: monsterName, hp: monsterHp, exp: monsterExp } = monster;
            // ?????? ????????? ??????
            if (mp - skillCost < 0) {
                tempScript += `??? : ???????????? ????????????.\n`;
                const script = tempScript;
                return { script, user, field };
            }
            // ?????? ????????? ?????? & ?????? cost ??????
            const playerSkillDamage = Math.floor((attack * multiple) / 100);
            const realDamage = services_1.BattleService.hitStrength(playerSkillDamage);
            user = yield services_1.CharacterService.refreshStatus(characterId, 0, skillCost, monsterId);
            // ??????????????? ?????? ????????? ??????
            const isDead = yield services_1.MonsterService.refreshStatus(monsterId, realDamage, characterId);
            if (!isDead)
                throw new Error('????????? ????????? ?????? ??? ????????????');
            tempScript += `\n????????? ${skillName} ????????? ${monsterName}?????? ??????! => ${realDamage}??? ?????????!\n`;
            if (isDead === 'dead') {
                // battleCache.set(characterId, { dead: 'monster' });
                yield cache_1.redis.hSet(characterId, { dead: 'monster' });
                return yield handler_1.battle.resultMonsterDead(monster, tempScript);
            }
            // isDead === 'alive'
            const script = tempScript;
            return { script, user, field };
        });
        this.skillSelector = (skill) => {
            const skillCounts = skill.length;
            const skillCosts = skill.map((s) => s.cost);
            const costSum = skillCosts.reduce((a, b) => a + b, 0);
            const chanceSum = skillCosts.reduce((a, b) => {
                return a + costSum / b;
            }, 0);
            const chance = Math.random();
            let skillIndex = 0;
            let cumChance = 0;
            for (let i = 0; i < skillCounts; i++) {
                const singleChance = (costSum / skillCosts[i]) / chanceSum;
                cumChance += singleChance;
                if (chance <= cumChance) {
                    skillIndex = i;
                    break;
                }
            }
            return skill[skillIndex];
        };
        this.run = (CMD, user) => __awaiter(this, void 0, void 0, function* () {
            const characterId = user.characterId.toString();
            let tempScript = '';
            const tempLine = '=======================================================================\n';
            tempScript += `... ???????????? ?????? ????????? ??????,\n`;
            tempScript += `????????? ?????? ????????? ?????? ??????????????? ????????????????????????.\n\n`;
            tempScript += `??? : ????????????. ?????????.\n\n`;
            tempScript += `?????? - ?????? ????????? ???????????????.\n`;
            tempScript += `?????? [number] - ????????? ????????? ????????? ???????????????.\n\n`;
            // ????????? ??????
            // await MonsterService.destroyMonster(Number(dungeonSession.monsterId));
            cache_1.redis.hDelBattleCache(characterId);
            cache_1.battleCache.delete(characterId);
            const script = tempLine + tempScript;
            const field = 'dungeon';
            return { script, user, field };
        });
    }
}
exports.default = new BattleAction();
