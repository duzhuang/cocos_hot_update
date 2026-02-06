/**
 * 获取配置
 * 功能：
 *  1. 加载不同环境的配置
 *  2. 提供获取配置的接口
 */

const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");


class config_manager {

    constructor(projectPath, environment = 'local') {
        /** 项目路径 */
        this.m_projectPath = projectPath;
        /** 环境 */
        this.m_environment = environment;
        /** 配置 */
        this.m_config = {};

        this.loadConifg();
    }

    loadConifg() {

        try {
            // 加载环境配置
            const envConfigPath = path.join(this.m_projectPath, `packages/hot-update/config/config.${this.m_environment}.json`);

            if (fs.existsSync(envConfigPath)) {
                const envConfig = JSON.parse(fs.readFileSync(envConfigPath, "utf8"));
                this.m_config = { ...envConfig };
            }

            logger.logNormal(`加载环境配置 ${this.m_environment} 成功`);

        } catch (error) {
            logger.logError(`加载环境配置 ${this.m_environment} 失败: ${error.message}`);
        }

    }



    /**
     * 增强版 get()
     * 支持点号分割和数组索引访问
     * 例如：
     *   get("database.host")
     *   get("servers[0].host")
     */
    get(key, defaultValue = null) {
        if (!key) return defaultValue;

        // 拆分路径，支持 a.b[0].c 这种形式
        const keys = key.replace(/\[(\d+)\]/g, ".$1").split(".");

        let value = this.m_config;

        for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }

        return value;
    }


    /**
     * 获取所有配置
     * @returns {Object} 所有配置
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.m_config));
    }

    /**
     * 验证配置是否完整
     * @returns {result:boolean,missingFields:Array} 是否完整
     */
    validate() {
        const requiredFields = ["hot_update.remoteUrl", "hot_update.version"];
        const missingFields = [];
        for (const field of requiredFields) {
            if (this.get(field) === null || this.get(field) === undefined || this.get(field).trim() === "") {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            return { result: false, missingFields };
        }

        return { result: true, missingFields: [] };
    }


}

module.exports = config_manager;