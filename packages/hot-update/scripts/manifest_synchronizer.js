/**
 * manifest 同步器
 * 功能：
 * 1、同步本地 manifest.json 到 apk 包中
 */

const fs = require("fs");
const path = require("path");

class manifest_synchronizer {
    /**
     * 构造函数
     * @param {string} project_dir 项目目录
     */
    constructor(sourcePath, targetPath) {
        /** 源目录 */
        this.m_sourcePath = sourcePath;
        /** 目标目录 */
        this.m_targetPath = targetPath;
    }

    /**
     * 同步 manifest.json 到 APK 
     */
    async sync() {
        try {
            await this.syncProjectManifest();
            await this.syncVersionManifest();
        } catch (error) {
            throw error;
        }
    }


    async syncProjectManifest() {
        const projectManifestPath = path.join(this.m_sourcePath, "project_manifest.json");
        const targetManifestPath = path.join(this.m_targetPath, "project_manifest.json");
        return await fs.promises.copyFile(projectManifestPath, targetManifestPath);

    }

    async syncVersionManifest() {
        const versionManifestPath = path.join(this.m_sourcePath, "version_manifest.json");
        const targetManifestPath = path.join(this.m_targetPath, "version_manifest.json");
        return await fs.promises.copyFile(versionManifestPath, targetManifestPath);
    }

}

async function cli() {
    const targetPath = process.argv[2];
    let sourcePath = process.argv[3];
    if (!sourcePath) {
        sourcePath = path.join(process.cwd(), "remote-assets");
    }

    // 同步 manifest.json 到 APK 
    const sync = new manifest_synchronizer(sourcePath, targetPath);
    try {
        await sync.sync();
        console.log("manifest 同步到 APK 成功");
    } catch (error) {
        console.error("manifest 同步到 APK 失败：" + error);
    }
}

if (require.main === module) {
    cli();
}

module.exports = manifest_synchronizer;
