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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_routes_1 = require("../../socket.routes");
const models_1 = require("../../db/models");
const services_1 = require("../../services");
const config_1 = __importDefault(require("../../db/redis/config"));
const __1 = require("..");
const encounter_Handler_1 = require("./encounter.Handler");
exports.default = {
    // help: (CMD: string | undefined, user: UserSession) => {}
    help: (CMD, user) => {
        let tempScript = '';
        const tempLine = '=======================================================================\n';
        tempScript += '명령어 : \n';
        tempScript += '[수동] 전투 진행 - 수동 전투를 진행합니다.\n';
        tempScript += '[자동] 전투 진행 - 자동 전투를 진행합니다.\n';
        tempScript += '[돌]아가기 - 이전 단계로 돌아갑니다.\n';
        const script = tempLine + tempScript;
        const field = 'battle';
        return { script, user, field };
    },
    autoAttack: (CMD, user) => __awaiter(void 0, void 0, void 0, function* () {
        let tempScript = '';
        let dead;
        let field = 'action';
        const { characterId } = user;
        const autoAttackId = encounter_Handler_1.battleLoops.get(characterId);
        console.log('autoAttackId: ', autoAttackId);
        console.log(encounter_Handler_1.battleLoops);
        if (!autoAttackId) {
            return { script: '', field, user, error: true };
        }
        // 유저&몬스터 정보 불러오기
        const { hp: playerHP, attack: playerDamage } = yield services_1.CharacterService.findByPk(characterId);
        const { monsterId } = yield config_1.default.hGetAll(String(characterId));
        const monster = yield models_1.Monsters.findByPk(monsterId);
        if (!monster)
            throw new Error('몬스터 정보 불러오기 실패');
        const { name: monsterName, hp: monsterHP, attack: monsterDamage, exp: monsterExp } = monster;
        // 유저 턴
        console.log('유저턴');
        const playerHit = services_1.BattleService.hitStrength(playerDamage);
        const playerAdjective = services_1.BattleService.dmageAdjective(playerHit, playerDamage);
        tempScript += `\n당신의 ${playerAdjective} 공격이 ${monsterName}에게 적중했다. => ${playerHit}의 데미지!\n`;
        const isDead = yield services_1.MonsterService.refreshStatus(+monsterId, playerHit, characterId);
        if (!isDead)
            throw new Error('몬스터 정보를 찾을 수 없습니다');
        if (isDead === 'dead') {
            console.log('몬스터 사망');
            dead = 'monster';
            const { script, field, user } = yield __1.battle.resultMonsterDead(monster, tempScript);
            return { script, field, user, dead };
        }
        // 몬스터 턴
        console.log('몬스터 턴');
        const monsterHit = services_1.BattleService.hitStrength(monsterDamage);
        const monsterAdjective = services_1.BattleService.dmageAdjective(monsterHit, monsterDamage);
        tempScript += `${monsterName} 이(가) 당신에게 ${monsterAdjective} 공격! => ${monsterHit}의 데미지!\n`;
        user = yield services_1.CharacterService.refreshStatus(characterId, monsterHit, 0, +monsterId);
        if (user.isDead === 'dead') {
            console.log('유저 사망');
            field = 'adventureResult';
            tempScript += '\n!! 치명상 !!\n';
            tempScript += `당신은 ${monsterName}의 공격을 버티지 못했습니다.. \n`;
            dead = 'player';
        }
        const script = tempScript;
        return { script, user, field, dead };
    }),
    resultMonsterDead: (monster, script) => __awaiter(void 0, void 0, void 0, function* () {
        const { characterId, name: monsterName, exp: monsterExp } = monster;
        const user = yield services_1.CharacterService.addExp(characterId, monsterExp);
        const field = 'encounter';
        script += `\n${monsterName} 은(는) 쓰러졌다 ! => Exp + ${monsterExp}\n`;
        if (user.levelup) {
            script += `\n==!! LEVEL UP !! 레벨이 ${user.level - 1} => ${user.level} 올랐습니다 !! LEVEL UP !!==\n\n`;
        }
        return { script, user, field };
    }),
    autoBattle: (CMD, user) => __awaiter(void 0, void 0, void 0, function* () {
        let tempScript = '';
        let field = 'action';
        const { characterId } = user;
        const whoIsDead = {
            'player': __1.dungeon.getDungeonList,
            'monster': __1.battle.autoBattle,
        };
        const { dungeonLevel } = yield config_1.default.hGetAll(String(characterId));
        // 몬스터 생성
        const newMonster = yield services_1.MonsterService.createNewMonster(+dungeonLevel, characterId);
        const monsterCreatedScript = `\n${newMonster.name}이(가) 등장했습니다.\n\n`;
        const dungeonSession = {
            dungeonLevel,
            monsterId: newMonster.monsterId.toString()
        };
        yield config_1.default.hSet(String(characterId), dungeonSession);
        socket_routes_1.socket.emit('printBattle', { script: monsterCreatedScript, field, user });
        // 자동공격 사이클
        const autoAttackId = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            encounter_Handler_1.battleLoops.set(characterId, autoAttackId);
            const { script, user: newUser, dead, error } = yield __1.battle.autoAttack(CMD, user);
            // 이미 끝난 전투
            // if (error) {
            //     return;
            // }
            // 자동공격 스크립트 계속 출력?
            const field = 'autoBattle';
            socket_routes_1.socket.emit('printBattle', { script, field, user: newUser });
            // dead = 'moster'|'player'|undefined
            if (dead) {
                const { script, field, user } = yield whoIsDead[dead]('', newUser);
                socket_routes_1.socket.emit('printBattle', { script, field, user });
                clearInterval(encounter_Handler_1.battleLoops.get(characterId));
                encounter_Handler_1.battleLoops.delete(characterId);
                return;
            }
        }), 1500);
        // battleLoops.set(characterId, autoAttackId);
        // 스킬공격 사이클
        return { script: tempScript, user, field };
    }),
    wrongCommand: (CMD, user) => {
        let tempScript = '';
        tempScript += `입력값을 확인해주세요.\n`;
        tempScript += `현재 입력 : '${CMD}'\n`;
        tempScript += `사용가능한 명령어가 궁금하시다면 '도움말'을 입력해보세요.\n`;
        const script = 'Error : \n' + tempScript;
        const field = 'battle';
        return { script, user, field };
    },
};
