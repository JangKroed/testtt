"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./src/app"));
const config_env_1 = __importDefault(require("./src/config.env"));
app_1.default.listen(config_env_1.default.PORT, () => {
});
