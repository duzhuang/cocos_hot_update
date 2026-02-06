/**
 * 部署器
 * 功能：
 *     1、将 manifest 资源部署到本地目录
 */

const fs = require('fs');

class manifest_deployer_local {

    constructor(targetPath,sourcePath) {
        /** 目标目录 */
        this.m_targetPath = targetPath;
        /** 源目录 */
        this.m_sourcePath = sourcePath;
    }

    /** 上传 */
    async upload() {
        // 检查目标目录是否存在，不存在则创建
        try {
            await this.checkDirExist(this.m_targetPath);
        } catch (error) {
            console.error(`检查目录 ${this.m_targetPath} 失败: ${error.message}`);
            throw error;
        }

        // 删除目标目录下的所有文件
        try {
            await this.removeDir(this.m_targetPath);
        } catch (error) {
            console.error(`删除目录 ${this.m_targetPath} 失败: ${error.message}`);
            throw error;
        }
        
        // 复制源目录到目标目录
        try {
            await fs.promises.cp(this.m_sourcePath, this.m_targetPath, { recursive: true });
        } catch (error) {
            console.error(`复制目录 ${this.m_sourcePath} 到 ${this.m_targetPath} 失败: ${error.message}`);
            throw error;
        }

        console.log(`复制目录 ${this.m_sourcePath} 到 ${this.m_targetPath} 成功`);

    }

    /**
    * 检查目录是否存在，不存在则创建
    * @param {string} dirPath 目录路径
    * @returns {Promise<boolean>} 目录是否存在
    */
    async checkDirExist(dirPath) {
        try {
            await fs.promises.access(dirPath);
            return true;
        } catch (err) {
            await fs.promises.mkdir(dirPath, { recursive: true });
            return false;
        }
    }

    /**
    * 删除目录
    * @param {string} dirPath 目录路径
    * @returns {Promise<void>}
    */
    async removeDir(dirPath) {
        try {
            await fs.promises.rm(dirPath, { recursive: true });
        } catch (err) {
            console.error(`删除目录 ${dirPath} 失败: ${err.message}`);
        }
    }

}



async function cli() {
    const targetPath = process.argv[2];
    let sourcePath = process.argv[3];

    if (!sourcePath) {
        sourcePath = path.join(process.cwd(), "remote-assets");
    }

    if(!targetPath){
        console.error("请输入目标目录");
        process.exit(1);        
    }

    // 上传 manifest 资源到本地目录
    const uploader = new manifest_deployer_local(targetPath,sourcePath);

    try {
        await uploader.upload();        
    } catch (error) {
        console.error(`上传 manifest 资源到本地目录失败: ${error.message}`);
        process.exit(1);
    }
}

/**
 * 当脚本作为主模块运行时执行
 */
if (require.main === module) {
    cli();
}

/**
 * CommonJS 导出
 */
module.exports = manifest_deployer_local;