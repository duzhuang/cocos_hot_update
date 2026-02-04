//Manifest 部署器


const fs = require("fs");
const path = require("path");

class main_add_hotUpdate {

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
            console.log("main.js 已经包含热更新代码块，无需重复插入。");
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
        console.error("请输入 main.js 路径");
        return;
    }


    const mainPath = path.join(buildPath, "main.js");
    const updateClass = new main_add_hotUpdate(mainPath);
    try {
        await updateClass.addHotUpdateCode();
    } catch (error) {
        console.error("main.js添加热更新代码失败:", error.message);
    }
}

if (require.main === module) {
    cli();
}

module.exports = main_add_hotUpdate