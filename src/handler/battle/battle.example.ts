import { UserSession } from '../../interfaces/user';

interface BattleLoop {
    [key: string]: NodeJS.Timer;
}
const battleLoops: BattleLoop = {};

export function example1Handler(CMD: string | undefined, user: UserSession) {
    

    const script = '';
    const field = '';
    return { script, user, field };
}

export function battleLoop(CMD: string | undefined, user: UserSession) {
    

    let cnt = 0;

    const name = setInterval(() => {
        
    }, 500);
    // eval(`const loop_${user.username} = ${name}`)
    battleLoops[user.username] = name;

    
    const script = 'start battle';
    const field = 'battle';
    return { script, user, field };
}

export function skill1(CMD: string | undefined, user: UserSession) {
    

    

    if (CMD === 'dead') clearInterval(battleLoops[user.username]);
    const script = 'aaaaaaaaaaaaaaaaa';
    const field = 'battle';
    return { script, user, field };
}
