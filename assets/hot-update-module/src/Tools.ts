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
        const path = jsb.fileUtils.getDefaultResourceRootPath() + relativePath;

        if (jsb.fileUtils.isFileExist(path)) {
            return jsb.fileUtils.getStringFromFile(path);
        } else {
            return null;
        }
    }



    /** 
     * 读取本地缓存资源
     * @param relativePath 资源路径，相对于缓存根目录
     * @returns 资源内容 (string)
     */
    public static loadCacheResource(relativePath: string): string {
        // 检查路径
        if (!relativePath || relativePath.trim() === "") {
            return null;
        }

        // 判断是否是原生环境
        if (!cc.sys.isNative) {
            return null;
        }

        // jsb.fileUtils.getWritablePath()  应用程序的持久化数据存储目录
        const path = jsb.fileUtils.getWritablePath() + relativePath;

        if (jsb.fileUtils.isFileExist(path)) {
            return jsb.fileUtils.getStringFromFile(path);
        } else {
            return null;
        }
    }

    /** 
     * 读取临时路径资源
     * @param relativePath 资源路径，相对于临时根目录
     * @returns 资源内容 (string)
     */
    public static loadTempResource(relativePath: string): string {
        // 检查路径
        if (!relativePath || relativePath.trim() === "") {
            return null;
        }

        // 判断是否是原生环境
        if (!cc.sys.isNative) {
            return null;
        }

        // jsb.fileUtils.getWritablePath()  应用程序的持久化数据存储目录
        const path = jsb.fileUtils.getWritablePath() + relativePath;

        if (jsb.fileUtils.isFileExist(path)) {
            return jsb.fileUtils.getStringFromFile(path);
        } else {
            return null;
        }
    }

    /** 
     * 复制目录
     * @param srcDir 源目录
     * @param destDir 目标目录
     * @param overwrite 是否覆盖已存在文件
     */
    public static copyDirectory(srcDir: string, destDir: string, overwrite: boolean = true): boolean {
        try {
            // 检查路径
            if (!srcDir || srcDir.trim() === "" || !destDir || destDir.trim() === "") {
                return false;
            }
            // 检查源目录是否存在
            if (!jsb.fileUtils.isDirectoryExist(srcDir)) {
                cc.error(`源目录不存在: ${srcDir}`);
                return false;
            }
            // 检查目标目录是否存在
            if (!jsb.fileUtils.isDirectoryExist(destDir)) {
                jsb.fileUtils.createDirectory(destDir);
            }

            const files = jsb.fileUtils.listFiles(srcDir);
            for (const filePath of files) {
                // 递归复制子目录
                if(jsb.fileUtils.isDirectoryExist(filePath)){
                    // 递归拷贝子目录
                    const subDirName = filePath.substring(filePath.lastIndexOf("/") + 1);
                    const newDest = destDir + "/" + subDirName;
                    if (!Tools.copyDirectory(filePath, newDest, overwrite)) {
                        return false;
                    }
                }else{
                    // 拷贝文件
                    const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
                    const destFile = destDir + "/" + fileName;
                    if(!overwrite && jsb.fileUtils.isFileExist(destFile)){
                        console.log(`跳过已存在的文件：${destFile}`);
                        continue;
                    }

                    const data = jsb.fileUtils.getStringFromFile(filePath);
                    if (!data || data.length === 0) {
                        cc.error(`读取文件失败: ${filePath}`);
                        return false;
                    }

                    const success = jsb.fileUtils.writeStringToFile(data, destFile);
                    if (!success) {
                        cc.error(`写入文件失败: ${destFile}`);
                        return false;
                    }
                }
            }
        } catch (e) {
            console.error("复制目录失败", e);
            return false;
        }
    }
}