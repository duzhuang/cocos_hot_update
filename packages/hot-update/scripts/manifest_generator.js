
/**
 * manifest 生成器
 * 功能：
 * 1、生成 version_manifest.json
 * 2、生成 project_manifest.json
 * 3、复制构建完成的资源到指定<remote-assets>目录
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 版本生成器
 */
class manifest_generator {


    /**
     * 构造函数
     * @param {string} project_dir 项目目录
     * @param {string} version 版本号
     * @param {string} remoteUrl 远程地址
     */
    constructor(project_dir, version, remoteUrl, params) {
        /** 项目目录 */
        this.m_project_dir = project_dir;
        /** 版本号 */
        this.m_version = version;
        /** 远程地址 */
        this.m_remoteUrl = remoteUrl;
        /** 参数 */
        this.m_params = params;
        /**本地存储的目标文件夹 */
        this.m_local_target_dir = path.join(this.m_project_dir, "remote-assets");
    }

    /**
     * 生成版本
     */
    async generate() {
        await this.generateVersionManifest();
        await this.generateProjectManifest();
    }

    /**
     * 生成版本清单
     */
    async generateVersionManifest() {
        const version_manifest = {
            //远程资源根目录       
            packageUrl: `${this.m_remoteUrl}/res/`,
            //远程资源清单地址
            remoteManifestUrl: `${this.m_remoteUrl}/res/project_manifest.json`,
            //远程版本清单地址
            remoteVersionUrl: `${this.m_remoteUrl}/res/version_manifest.json`,
            version: this.m_version,
        };

        // 写入文件
        await this.checkDirExist(this.m_local_target_dir);
        const version_manifest_path = path.join(this.m_local_target_dir, "version_manifest.json");
        await fs.promises.writeFile(version_manifest_path, JSON.stringify(version_manifest, null, 4));
    }

    /**
     * 生成资源清单
     */
    async generateProjectManifest() {
        // 资源目录
        let project_manifest = {
            //远程资源根目录       
            packageUrl: `${this.m_remoteUrl}/res/`,
            //远程资源清单地址
            remoteManifestUrl: `${this.m_remoteUrl}/res/project_manifest.json`,
            //远程版本清单地址
            remoteVersionUrl: `${this.m_remoteUrl}/res/version_manifest.json`,
            version: this.m_version,
        };

        project_manifest = await this.generateMD5(project_manifest);

        // 写入文件
        const project_manifest_path = path.join(this.m_local_target_dir, "project_manifest.json");
        await fs.promises.writeFile(project_manifest_path, JSON.stringify(project_manifest, null, 4));

        // 复制 构建完成的 目录
        await this.copyBuildDir();
    }

    /**
     * 生成 MD5
     * @param {object} project_manifest 资源清单
     */
    async generateMD5(project_manifest) {
        // 需要生成两个文件夹下的md5
        const folders = ["assets", "src"];
        const md5Object = {};

        const sourceDir = this.getLocalSourcePath();
        await Promise.all(folders.map(async folder => {
            const folderPath = path.join(sourceDir, folder);
            await this.calculateMD5(folderPath, md5Object);
        }));

        project_manifest["assets"] = md5Object;

        return project_manifest;
    }

    /**
     * 计算目录下所有文件的 MD5
     * @param {string} folder_path 目录路径     
     * @param {object} md5Object 存储 md5 的对象
     */
    async calculateMD5(folder_path, md5Object){           
        try {
            const stat = await fs.promises.stat(folder_path);
            if (stat.isDirectory()) {
                const files = await fs.promises.readdir(folder_path);
                for (const file of files) {
                    const srcFile = path.join(folder_path, file);
                    await this.calculateMD5(srcFile, md5Object);
                }
            } else if (stat.isFile()) {
                const size = stat.size;
                const md5Hash = crypto.createHash("md5");
                md5Hash.update(await fs.promises.readFile(folder_path));
                const md5 = md5Hash.digest("hex");
                const sourceDir = this.getLocalSourcePath();
                const relativePath = path.relative(sourceDir, folder_path);
                md5Object[relativePath] = {
                    "size": size,
                    "md5": md5,
                }
            }
        } catch (error) {
            console.error(`计算目录 ${folder_path} 的 MD5 失败: ${error.message}`);
        }            
    }


    /**
     * 复制 构建完成的 目录
     */
    async copyBuildDir() {
        // 验证 build 目录是否存在
        const build_dir = path.join(this.m_project_dir, "build");
        if (!await this.checkDirExist(build_dir)) {
            console.error("build 目录不存在");
            return;
        }

        // 验证 jsb-default 目录是否存在
        const jsb_default_dir = this.getLocalSourcePath();
        if (!await this.checkDirExist(jsb_default_dir)) {
            console.error("jsb-default 目录不存在");
            return;
        }

        // 打包后的资源路径
        const source_dir = this.getLocalSourcePath();


        // 拷贝 assets
        const assets_dir = path.join(source_dir, "assets");
        const dest_assets_dir = path.join(this.m_local_target_dir, "assets");        
        await this.removeDir(dest_assets_dir);
        await this.checkDirExist(dest_assets_dir);
        await this.copyDir(assets_dir, dest_assets_dir);

        // 拷贝 src
        const src_dir = path.join(source_dir, "src");
        const dest_src_dir = path.join(this.m_local_target_dir, "src");
        await this.removeDir(dest_src_dir);
        await this.checkDirExist(dest_src_dir);
        await this.copyDir(src_dir, dest_src_dir);
    }

    /**
     * 获取本地资源路径
     * @returns {string} 本地资源路径
     */
    getLocalSourcePath() {
        return path.join(this.m_project_dir, "build/jsb-default");
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
            return true;
        } catch (err) {
            console.error(`删除目录 ${dirPath} 失败: ${err.message}`);
            return false;
        }
    }


    /**
     * 复制文件
     * @param {string} srcPath 源文件路径
     * @param {string} destPath 目标文件路径
     */
    async copyDir(srcPath, destPath) {
        
        try {
            const stat = await fs.promises.stat(srcPath);
            // 如果是目录，递归复制
            if (stat.isDirectory()) {
                await this.checkDirExist(destPath);
                const files = await fs.promises.readdir(srcPath);
                for (const file of files) {
                    const srcFile = path.join(srcPath, file);
                    const destFile = path.join(destPath, file);
                    await this.copyDir(srcFile, destFile);
                }
            } else {
                await fs.promises.copyFile(srcPath, destPath);
            }
        } catch (error) {
            console.error(`复制失败: ${srcPath} -> ${destPath}, 错误: ${err.message}`);
        }
       
    }
}


/**
 * 命令行接口
 */
async function cli() {
    /** 远程地址 */
    const remoteUrl = process.argv[2];
    /** 版本号 */
    const version = process.argv[3];
    /** 项目目录 */
    let project_dir = process.argv[4];   

    /** 远程地址是否存在 */
    if (!remoteUrl || remoteUrl.trim() === "") {
        console.error("请输入远程地址");
        process.exit(1);
    }

    // 如果目录不存在，默认当前目录
    if (!project_dir) {
        project_dir = process.cwd();
    }

    if (!version || version.trim() === "") {
        console.error("请输入版本号");
        process.exit(1);
    }
    
    const generator = new manifest_generator(project_dir, version, remoteUrl);

    try {
        await generator.generate();
        console.log("manifest 生成成功");
        console.log(`版本号: ${version}`);
        console.log(`远程地址: ${remoteUrl}`);
    } catch (error) {
        console.error("生成 manifest 失败:", error.message);
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
module.exports = manifest_generator;