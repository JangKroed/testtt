"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skill1 = exports.battleLoop = exports.example1Handler = void 0;
const battleLoops = {};
function example1Handler(CMD, user) {
    const script = '';
    const field = '';
    return { script, user, field };
}
exports.example1Handler = example1Handler;
function battleLoop(CMD, user) {
    let cnt = 0;
    const name = setInterval(() => {
    }, 500);
    // eval(`const loop_${user.username} = ${name}`)
    battleLoops[user.username] = name;
    const script = 'start battle';
    const field = 'battle';
    return { script, user, field };
}
exports.battleLoop = battleLoop;
function skill1(CMD, user) {
    if (CMD === 'dead')
        clearInterval(battleLoops[user.username]);
    const script = 'aaaaaaaaaaaaaaaaa';
    const field = 'battle';
    return { script, user, field };
}
exports.skill1 = skill1;
