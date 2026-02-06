const path = require("path");
const { exec } = require("child_process");
const logger = require("./utils/logger");
const config_manager = require("./config/config_manager");


module.exports = {

    load() {
        Editor.Builder.on('build-finished', onBuildFinish);
    },

    unload() {
        Editor.Builder.removeListener('build-finished', onBuildFinish);
    },
};


/**
* 构建完成回调
* @param {object} options 构建选项
* @param {function} callback 回调函数
*/
async function onBuildFinish(options, callback) {

    logger.logGreen(` --- HOTUPDATE-START ---`);

    // 项目路径
    const projectPath = options.project;
    // 构建路径
    const buildPath = options.dest;

    // 热更新代码注入器
    try {
        await hotUpdateInjector(projectPath, buildPath);
        logger.logNormal(`热更新代码注入器：注入成功`);
    } catch (error) {
        logger.logRed(`热更新代码注入器：注入失败 ${error}`);
    }

    // 处理 manifest 流程
    try {
        await processManifest(projectPath);
        logger.logNormal(`manifest 流程处理成功`);
        logger.logGreen(` --- HOTUPDATE-FINISH ---`);
    } catch (error) {
        logger.logRed(`manifest 流程处理失败 ${error}`);
        logger.logRed(` --- HOTUPDATE-FINISH (FAILED) ---`);
    }

    callback && callback();
}


/**
 * 热更新代码注入器
 * @param {*} projectPath 项目路径
 * @param {*} targetPath 目标路径
 */
async function hotUpdateInjector(projectPath, targetPath) {
    logger.logBlue(`热更新代码注入器：开始注入热更新代码`);

    const scriptPath = path.join(projectPath, "packages/hot-update/scripts/hot_update_injector.js");
    const command = `node ${scriptPath} ${targetPath}`;

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (stdout) {
                logger.logNormal(`hot_update_injector.js:\n${stdout}`);
            }
            if (stderr) {
                logger.logRed(`hot_update_injector.js:\n${stderr}`);
            }
            if (error) {
                reject(new Error(stderr || error.message));
                return;
            }
            resolve(true);
        });
    });
}

/**
 * 处理 manifest 文件
 */
async function processManifest(projectPath) {
    logger.logBlue(`manifest 处理器：开始处理 manifest 文件`);

    // 根据 配置的环境 加载 配置
    const config = new config_manager(projectPath, "local");

    // 第一步：生成 manifest 
    try {
        await manifestGenerator(projectPath, config);
        logger.logNormal(`manifest 生成成功`);
    } catch (error) {        
        throw new Error(`manifest 生成失败`);
    }
}

/**
 * 生成 manifest 文件
 * @param {*} projectPath 项目路径
 * @param {*} config 配置
 */
async function manifestGenerator(projectPath, config) {

    const scriptPath = path.join(projectPath, "packages/hot-update/scripts/manifest_generator.js");

    const remoteUrl = config.get("hot_update.remoteUrl");
    const version = config.get("hot_update.version"); 
    
    const vaildResult = config.validate();
    if (!vaildResult.result) {
        logger.logRed(`配置缺失字段: ${vaildResult.missingFields.join(", ")}`);
        throw new Error();
    }

    const command = `node ${scriptPath} ${remoteUrl} ${version} ${projectPath}`;

    logger.logBlue(`command 执行的命令是：`,command);

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (stdout) {
                logger.logNormal(`manifest_generator.js:\n${stdout}`);
            }
            if (stderr) {
                logger.logRed(`manifest_generator.js:\n${stderr}`);
            }
            if (error) {
                reject(false);
                return;
            }
            resolve(true);
        });
    });
}