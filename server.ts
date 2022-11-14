import httpServer from './src/app';
import env from './src/config.env';
import { Server } from 'socket.io';

import cluster from 'cluster';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import numCPU from 'os';
const numCPUs = numCPU.cpus().length;
import { setupMaster, setupWorker } from '@socket.io/sticky';

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    setupMaster(httpServer, {
        loadBalancingMethod: 'least-connection', // either "random", "round-robin" or "least-connection"
    });
    httpServer.listen(env.PORT, () => {
        console.log(env.NODE_ENV);
        console.log('SERVER RUNNING ON ', env.PORT);
    });

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    console.log(`Worker ${process.pid} started`);

    const pubClient = createClient({
        url: `redis://${env.REDIS_USER}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}/0`,
    });
    const subClient = pubClient.duplicate();

    const io = new Server(httpServer);
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        setupWorker(io);
        io.listen(3000);
    });

    io.on('connection', (socket) => {
        /* ... */
    });
}
