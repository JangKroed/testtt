"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./src/app"));
const config_env_1 = __importDefault(require("./src/config.env"));
const socket_io_1 = require("socket.io");
const cluster_1 = __importDefault(require("cluster"));
const redis_1 = require("redis");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const os_1 = __importDefault(require("os"));
const numCPUs = os_1.default.cpus().length;
const sticky_1 = require("@socket.io/sticky");
if (cluster_1.default.isMaster) {
    console.log(`Master ${process.pid} is running`);
    (0, sticky_1.setupMaster)(app_1.default, {
        loadBalancingMethod: 'least-connection', // either "random", "round-robin" or "least-connection"
    });
    app_1.default.listen(config_env_1.default.PORT, () => {
        console.log(config_env_1.default.NODE_ENV);
        console.log('SERVER RUNNING ON ', config_env_1.default.PORT);
    });
    for (let i = 0; i < numCPUs; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on('exit', (worker) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster_1.default.fork();
    });
}
else {
    console.log(`Worker ${process.pid} started`);
    const pubClient = (0, redis_1.createClient)({
        url: `redis://${config_env_1.default.REDIS_USER}:${config_env_1.default.REDIS_PASSWORD}@${config_env_1.default.REDIS_HOST}/0`,
    });
    const subClient = pubClient.duplicate();
    const io = new socket_io_1.Server(app_1.default);
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        (0, sticky_1.setupWorker)(io);
        io.listen(3000);
    });
    io.on('connection', (socket) => {
        /* ... */
    });
}
