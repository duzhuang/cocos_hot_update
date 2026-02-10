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
        if (!jsb.fileUtils.isDirectoryExist(this.m_tempDirectoryPath)) {
            jsb.fileUtils.createDirectory(this.m_tempDirectoryPath);
        }
        if (!jsb.fileUtils.isDirectoryExist(this.m_cacheDirectoryPath)) {
            jsb.fileUtils.createDirectory(this.m_cacheDirectoryPath);
        }      
    }


    /** 
     * 复制临时文件夹到缓存文件夹
     */
    public copyTempToCache() {        
        // 检查临时文件夹是否存在
        if (!jsb.fileUtils.isDirectoryExist(this.m_tempDirectoryPath)) {
            return;
        }        
        // 复制临时文件夹到缓存文件夹
        Tools.copyDirectory(this.m_tempDirectoryPath, this.m_cacheDirectoryPath, true);
    }


    /** 
     * 清除临时文件夹
     */
    public clearTempDirectory() {
        // 清除临时文件夹
        // 检查临时文件夹是否存在
        if (!jsb.fileUtils.isDirectoryExist(this.m_tempDirectoryPath)) {
            return;
        }
        jsb.fileUtils.removeDirectory(this.m_tempDirectoryPath);
    }



}