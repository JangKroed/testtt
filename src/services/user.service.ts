import bcrypt from 'bcrypt';
import { Users } from '../db/models';
import { redis } from '../db/cache';
import { HttpException, HttpStatus } from '../common';
import { CharacterService } from '.';


class UserService {

    async signup({ username, password }: Partial<Users>) {
        const user = {
            username: username!,
            password: await bcrypt.hash(password!, 10),
        }
        return await Users.create(user);
    }

    async signin({ username, password }: Partial<Users>) {
        const user = await Users.findOne({
            where: { username }
        });
        if (!user) return null;
        
        const result = await bcrypt.compare(password!, user!.password);
        if (!result) return null;

        return user;
    }

    async dupCheck(username: string) {
        const user = await Users.findOne({ 
            where: { username }
         });

        return Boolean(user);
    }

    async signout(userId: number, id: string) {
        
        // redis.hDelAll(id, { userId: 0, characterId: 0 });
        redis.del(id);
    };

    async deleteUser(userId: number|string, characterId: number|string) {
        const result = await CharacterService.deleteCharacter(+userId, +characterId);
        if (result === 0) return 0
        return await Users.destroy({
            where: { userId }
        });
    }
}


export default new UserService();