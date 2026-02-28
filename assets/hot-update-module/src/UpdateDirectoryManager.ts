import Tools from "./Tools";

/** 
 * 更新目录管理器
 * 负责创建和管理热更新所需的临时文件夹和缓存文件夹。
 */
export default class UpdateDirectoryManager {

    /** 临时文件夹路径 */
    private m_tempDirectoryPath: string;
    /** 缓存文件夹路径 */
    private m_cacheDirectoryPath: string;

    constructor(tempDirectoryPath: string = "hotUpdateTemp/", cacheDirectoryPath: string = "hotUpdate/") {
        this.m_tempDirectoryPath = tempDirectoryPath;
        this.m_cacheDirectoryPath = cacheDirectoryPath;
    }

    /** 
     * 创建临时文件夹和缓存文件夹
     */
    public prepareUpdateDirectories() {
        // 检查临时文件夹和缓存文件夹是否存在           
        Tools.creatDirectoryExistInCache(this.m_tempDirectoryPath);
        Tools.creatDirectoryExistInCache(this.m_cacheDirectoryPath);
    }


    /** 
     * 复制临时文件夹到缓存文件夹
     * @returns 是否复制成功
     */
    public async copyTempToCache(): Promise<boolean> {

        // 检查临时文件夹是否存在
        if (!Tools.isDirectoryExistInCache(this.m_tempDirectoryPath)) {
            return false;
        }
        const fullTempPath = Tools.getFullPathInCache(this.m_tempDirectoryPath);
        const fullCachePath = Tools.getFullPathInCache(this.m_cacheDirectoryPath);

        // 复制临时文件夹到缓存文件夹
        const success = await Tools.copyDirectoryAsync(fullTempPath, fullCachePath, true);
        if (success) {
            this.clearTempDirectory();
            return true;
        } else {
            return false;
        }
    }


    /** 
     * 清除临时文件夹
     */
    public clearTempDirectory() {
        // 清除临时文件夹
        // 检查临时文件夹是否存在
        // 添加写入路径
        if(!Tools.isDirectoryExistInCache(this.m_tempDirectoryPath)) {
            return;
        }
        // 删除临时文件夹
        Tools.removeDirectoryInCache(this.m_tempDirectoryPath);
    }

}