export default class Tools {

    /** 
     * 读取包内资源
     * @param relativePath 资源路径，相对于资源根目录
     * @returns 资源内容 (string)
     */
    public static loadPackageResource(relativePath: string): string {
        // 检查路径
        if (!relativePath || relativePath.trim() === "") {
            return null;
        }

        // 判断是否是原生环境
        if (!cc.sys.isNative) {
            return null;
        }

        // jsb.fileUtils.getDefaultResourceRootPath() 应用程序安装包内的资源目录
        const fullPath = jsb.fileUtils.getDefaultResourceRootPath() + "assets/" + relativePath;

        console.log("读取包内资源: 加载的相对路径：", relativePath);
        console.log("读取包内资源: 加载的绝对路径：", fullPath);

        if (jsb.fileUtils.isFileExist(fullPath)) {
            return jsb.fileUtils.getStringFromFile(fullPath);
        } else {
            return null;
        }
    }



    /** 
     * 读取本地缓存资源
     * @param relativePath 资源路径，相对于缓存根目录
     * @returns 资源内容 (string|null)
     */
    public static loadCacheResource(relativePath: string): string | null {
        // 检查路径
        if (!Tools.checkPathIsValidInCache(relativePath)) {
            return null;
        }       

        if (Tools.isFileExistInCache(relativePath)) {
            return Tools.getStringFromFileInCache(relativePath);
        } else {
            return null;
        }
    }

    /** 
     * 读取临时路径资源
     * @param relativePath 资源路径，相对于临时根目录
     * @returns 资源内容 (string | null)
     */
    public static loadTempResource(relativePath: string): string | null {

        if (Tools.checkPathIsValidInCache(relativePath)) {
            return null;
        }
        
        if (Tools.isFileExistInCache(relativePath)) {
            return Tools.getStringFromFileInCache(relativePath);
        } else {
            return null;
        }
    }


    /** 
     * 异步复制目录
     * @param srcDir 源目录路径(绝对路径)
     * @param destDir 目标目录路径(绝对路径)
     * @param overwrite 是否覆盖已存在文件
     * @returns 是否复制成功
     */
    public static async copyDirectoryAsync(srcDir: string, destDir: string, overwrite: boolean = true): Promise<boolean> {
        if (!jsb.fileUtils.isDirectoryExist(srcDir)) {
            cc.error(`源目录不存在: ${srcDir}`);
            return false;
        }

        if (!jsb.fileUtils.isDirectoryExist(destDir)) {
            jsb.fileUtils.createDirectory(destDir);            
        }

        const files = jsb.fileUtils.listFiles(srcDir);
        for (const file of files) {
            if (file.endsWith("./") || file.endsWith("../")) continue;

            if (jsb.fileUtils.isDirectoryExist(file)) {
                let path = file;
                // 去掉末尾的 /
                if (path.endsWith("/")) path = path.substring(0, path.length - 1);
                // 获取最后一级目录名 
                const subDirName = path.substring(path.lastIndexOf("/") + 1);                
                const newDest = destDir + subDirName + "/";
                const ok = await this.copyDirectoryAsync(file, newDest, overwrite);
                if (!ok) return false;
            } else {
                const fileName = file.substring(file.lastIndexOf("/") + 1);
                const destFile = destDir + fileName;

                if (!overwrite && jsb.fileUtils.isFileExist(destFile)) continue;                
                //@ts-ignore
                const data = jsb.fileUtils.getDataFromFile(file);
                //@ts-ignore
                const ok = jsb.fileUtils.writeDataToFile(data, destFile);
                if (!ok) {
                    cc.error(`拷贝文件失败: ${file} -> ${destFile}`);
                    return false;
                }
            }
        }
        return true;
    }

    /** 
     * 从文件中读取数据
     * @param fullPath 文件路径(绝对路径)
     * @returns 数据 (string | null)
     */
    public static async getBinaryDataFromFile(fullPath: string): Promise<Uint8Array | null> {

        if (!fullPath || fullPath.trim() === "") {
            return null;
        }

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", fullPath, true);
            xhr.responseType = "arraybuffer"; // 响应类型为 arraybuffer 二进制数据
            xhr.onload = function () {
                if (xhr.status === 200) {
                    const arrayBuffer = xhr.response;
                    const uint8Array = new Uint8Array(arrayBuffer);
                    const binaryData = String.fromCharCode.apply(null, uint8Array);
                    resolve(uint8Array);
                } else {
                    console.error("请求失败，状态码:", xhr.status);
                    reject(new Error("请求失败，状态码: " + xhr.status));
                }
            };

            xhr.onerror = function () {
                reject(new Error("请求失败"));
            };
            xhr.send();
        })
    }



    /** 
     * 保存文本到文件
     * @param relativePath 文件路径
     * @param text 文本内容
     * @returns 是否保存成功
     */
    public static writeStringToFileInCache(text: string, relativePath: string): boolean {       

        // 检查路径是否有效
        if (!Tools.checkPathIsValidInCache(relativePath)) {
            return false;
        }

        // 检查文件是否存在
        const fullPath = Tools.getFullPathInCache(relativePath);
        if (fullPath === "") {
            return false;
        }
        
        if (Tools.isFileExistInCache(relativePath)) {            
            jsb.fileUtils.removeFile(fullPath);
        }

        jsb.fileUtils.writeStringToFile(text, fullPath);
    }


    /** 
     * 检查缓存目录是否存在
     * @param relativePath 缓存目录路径，相对于缓存根目录
     * @returns 是否存在
     */
    public static isDirectoryExistInCache(relativePath: string): boolean {
        
        // 检查路径是否有效
        if (!Tools.checkPathIsValidInCache(relativePath)) {
            return false;
        }
        
        const fullPath = Tools.getFullPathInCache(relativePath);
        if (fullPath === "") {
            return false;
        }

        return jsb.fileUtils.isDirectoryExist(fullPath);
    }

    /**
     * 创建目录在 缓存 目录中
     * @param relativePath 
     * @returns 是否创建成功
     */
    public static creatDirectoryExistInCache(relativePath: string): boolean {

        if (Tools.isDirectoryExistInCache(relativePath)) {
            return true;
        }

        // 检查路径是否有效
        if (!Tools.checkPathIsValidInCache(relativePath)) {
            return false;
        }

        const fullPath = Tools.getFullPathInCache(relativePath);
        if (fullPath === "") {
            return false;
        }

        return jsb.fileUtils.createDirectory(fullPath) === "true";
    }

    /** 
     * 检查缓存文件是否存在
     * @param relativePath 缓存文件路径，相对于缓存根目录
     * @returns 是否存在
     */
    public static isFileExistInCache(relativePath: string): boolean {
        // 检查路径是否有效
        if (!Tools.checkPathIsValidInCache(relativePath)) {
            return false;
        }

        const fullPath = Tools.getFullPathInCache(relativePath);
        if (fullPath === "") {
            return false;
        }

        return jsb.fileUtils.isFileExist(fullPath);
    }


    /** 
     * 从缓存文件中读取文本
     * @param relativePath 缓存文件路径，相对于缓存根目录
     * @returns 文本内容 (string | null)
     */
    public static getStringFromFileInCache(relativePath: string): string|null {
        // 检查路径是否有效
        if (!Tools.checkPathIsValidInCache(relativePath)) {
            return null;
        }

        const fullPath = Tools.getFullPathInCache(relativePath);
        if (fullPath === "") {
            return null;
        }

        return jsb.fileUtils.getStringFromFile(fullPath);
    }


    /** 
     * 删除缓存目录
     * @param relativePath 缓存目录路径，相对于缓存根目录
     * @returns 是否删除成功
     */
    public static removeDirectoryInCache(relativePath: string): boolean {
        // 检查路径是否有效
        if (!Tools.checkPathIsValidInCache(relativePath)) {
            return false;
        }

        const fullPath = Tools.getFullPathInCache(relativePath);
        if (fullPath === "") {
            return false;
        }

        return jsb.fileUtils.removeDirectory(fullPath);
    }

    /** 
     * 列出缓存目录中的文件
     * @param relativePath 缓存目录路径，相对于缓存根目录
     * @returns 文件路径列表
     */
    public static listFilesInCache(relativePath: string): string[] {       
        // 检查路径是否有效
        if (!Tools.checkPathIsValidInCache(relativePath)) {
            return [];
        }

        const fullPath = Tools.getFullPathInCache(relativePath);
        if(fullPath === ""){
            return [];
        }

        return jsb.fileUtils.listFiles(fullPath);
    }


    /** 
     * 获取缓存文件的完整路径
     * @param relativePath 缓存文件路径，相对于缓存根目录
     * @returns 完整路径 如果路径无效，返回空字符串
     */
    public static getFullPathInCache(relativePath: string): string {
        if (!Tools.checkPathIsValidInCache(relativePath)) {
            return "";
        }
        return jsb.fileUtils.getWritablePath() + relativePath;
    }

    /** 
     * 检查缓存路径是否有效
     * @param relativePath 缓存路径，相对于缓存根目录
     * @returns 是否有效
     */
    public static checkPathIsValidInCache(relativePath: string): boolean {
        // 检查路径
        if (!relativePath || relativePath.trim() === "") {
            return false;
        }

        // 判断是否是原生环境
        if (!cc.sys.isNative) {
            return false;
        }

        return true;
    }

}