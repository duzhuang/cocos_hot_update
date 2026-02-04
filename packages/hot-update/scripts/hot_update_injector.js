/**
 * 热更新代码注入器
 * 功能：
 * 1、给项目启动脚本 main.js 添加热更新代码 
 * 2、设置 searchPaths 添加 热更新目录
 */

const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

class hot_update_injector {

    constructor(path) {
        this.m_path = path;
    }


    /**
     * 添加热更新代码     
     */
    async addHotUpdateCode() {

        // 在 main.js 文件内容中添加热更新代码
        const hotUpdateCode = `
// --- HOTUPDATE-SEARCHPATHS-START ---
(function(){
    if(typeof window.jsb === "object"){
        var hotUpdateSearchPaths = localStorage.getItem('HotUpdateSearchPaths');
        if (hotUpdateSearchPaths) {
            jsb.fileUtils.setSearchPaths(JSON.parse(hotUpdateSearchPaths));            
        }
    }
})();
// --- HOTUPDATE-SEARCHPATHS-END ---
        `;

        // 读取 main.js 文件内容
        const mainjsContent = await fs.promises.readFile(this.m_path, "utf8");

        // 检查是否已经插入过（通过标记） 
        if (mainjsContent.includes('// --- HOTUPDATE-SEARCHPATHS-START ---')) {
            logger.logNormal("main.js 已经包含热更新代码块，无需重复插入。");
            return;
        }

        // 将热更新代码添加到 main.js 文件头
        const newMainjsContent = hotUpdateCode + "\n" + mainjsContent;

        // 写入修改后的 main.js 文件内容
        return await fs.promises.writeFile(this.m_path, newMainjsContent, "utf8");
    }
}

async function cli() {

    const buildPath = process.argv[2];
    if (!buildPath) {
        logger.logRed("请输入 main.js 路径");
        return;
    }

    const mainPath = path.join(buildPath, "main.js");
    const updateClass = new hot_update_injector(mainPath);
    try {
        await updateClass.addHotUpdateCode();
        logger.logNormal("main.js添加热更新代码成功");
    } catch (error) {
        logger.logRed("main.js添加热更新代码失败:", error.message);
    }
}

if (require.main === module) {

    logger.logNormal("热更新代码注入器：开始执行");

    cli();
}

module.exports = hot_update_injector
