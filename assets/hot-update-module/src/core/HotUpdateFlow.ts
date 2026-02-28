import Downloader from "../Downloader";
import { IHotUpdateResource } from "../interfaces/IHotUpdateResource";
import ManifestManager from "../ManifestManager";
import UpdateApplier from "../UpdateApplier";
import UpdateDirectoryManager from "../UpdateDirectoryManager";
import Verifier from "../Verifier";

/**
 * 热更新流程
 */
export default class HotUpdateFlow {

    /** 是否重试 */
    private m_isRetry: boolean = false;
    /** 资源下载的基础路径*/
    private m_basePackageUrl: string = "";

    private m_manifestMgr: ManifestManager;
    private m_dirMgr: UpdateDirectoryManager;
    private m_downloader: Downloader
    private m_verifier: Verifier;
    private m_applier: UpdateApplier;

    constructor() {
        this.m_manifestMgr = new ManifestManager();
        this.m_dirMgr = new UpdateDirectoryManager();
        this.m_downloader = new Downloader();
        this.m_verifier = new Verifier();
        this.m_applier = new UpdateApplier();
    }

    /**
     * 检查是否需要热更新
     * @returns 是否需要热更新 
     */
    async checkHotUpdate(): Promise<boolean> {       
        // 加载本地 manifest
        const {
            projectManifest: localProjectManifest,
            versionManifest: localVersionManifest
        } = this.m_manifestMgr.loadLocalManifest();        

        if(!localProjectManifest || !localVersionManifest){
            console.error("加载本地 manifest 文件失败");
            return false;
        }

        // 下载远程 version_.manifest 文件, 并对比版本号
        const remoteVersionManifest = await this.m_manifestMgr.downloadRemoteVersionManifest(localVersionManifest.remoteVersionUrl);
        if(!remoteVersionManifest){
            console.error("下载远程 version_.manifest 文件失败");
            return false;
        }

        console.log(`本地版本号: ${JSON.stringify(localVersionManifest)}`);
        console.log(`远程版本号: ${JSON.stringify(remoteVersionManifest)}`);

        if (!this.m_manifestMgr.needUpdate(localVersionManifest.version, remoteVersionManifest.version)) {
            console.log("本地版本号大于等于远程版本号，无需更新");
            return false;
        }else{
            console.log("本地版本号小于远程版本号，需要更新");
            return true;
        }
    }

    /**
     * 热更新流程
     * @returns 热更新结果 { success: boolean, error?: string }
     */
    async hotUpdateFlow(): Promise<{ success: boolean, error?: string }> {        

        // 加载本地 manifest
        const {
            projectManifest: localProjectManifest,
            versionManifest: localVersionManifest
        } = this.m_manifestMgr.loadLocalManifest();

        // 创建临时文件夹和缓存文件夹
        this.m_dirMgr.prepareUpdateDirectories();

        if(!localProjectManifest || !localVersionManifest){
            console.error("加载本地 manifest 文件失败");
            return { success: false, error: "加载本地 manifest 文件失败" };
        }

        // 下载远程 version_.manifest 文件, 并对比版本号
        const remoteVersionManifest = await this.m_manifestMgr.downloadRemoteVersionManifest(localVersionManifest.remoteVersionUrl);
        if (!this.m_manifestMgr.needUpdate(localVersionManifest.version, remoteVersionManifest.version)){
            console.log("本地版本号大于等于远程版本号，无需更新");
            return { success: true };
        }

        // 下载远程 project_manifest 文件, 并对比差异
        const remoteProjectManifest = await this.m_manifestMgr.downloadRemoteProjectManifest(localVersionManifest.remoteManifestUrl);


        // 对比差异
        let diffMap: IHotUpdateResource[];
        try {
            console.log("对比差异");
            diffMap = await this.m_manifestMgr.generateDiffMap(remoteProjectManifest, localProjectManifest);
            console.log(`对比差异结果: ${JSON.stringify(diffMap)}`);
        } catch (err) {
            console.error(`对比差异失败: ${err}`);
            // 处理对比差异失败
            return { success: false, error: `对比差异失败: ${err}` };
        }        


        // 下载：对比差异结果是否为空
        if (diffMap.length === 0) {
            console.log("对比差异结果为空，无需更新");
            return { success: true };
        }

        // 下载：设置资源下载的基础路径
        this.m_basePackageUrl = remoteVersionManifest.packageUrl;
        
        // 下载：创建下载任务        
        const tasks = this.m_downloader.createDownloadTasks(diffMap, this.m_basePackageUrl);
        // 下载：获取需要下载的总字节数
        const totalBytes = this.m_manifestMgr.getTotalBytesToDownload(diffMap);        
        const results = await this.m_downloader.downloadAssets(tasks, totalBytes); 

        // 下载：处理重试失败的任务
        if (this.m_isRetry) {
            // 重试失败的任务
            const failedTasks = results.filter((item) => !item.success);
            if (failedTasks.length > 0) {
                const retryTasks = this.m_downloader.createRetryDownloadTasks(failedTasks);
                const retryResults = await this.m_downloader.retryFailedDownloads(retryTasks);
                results.push(...retryResults);
            }
        }


        console.log(`下载完成，共下载 ${results.length} 个资源`);
        console.log("下载结果: ", JSON.stringify(results));

        // 下载：处理资源下载有失败的情况
        if (results.some((item) => !item.success)) {
            console.error(`有资源下载失败: ${results.filter((item) => !item.success)}`);
            // 处理资源下载失败的情况，比如提示用户网络异常，或者重试下载等
            return { success: false, error: `有资源下载失败: ${results.filter((item) => !item.success)}` };
        }

        // // 验证：验证下载的资源文件
        // const allVerified = this.m_verifier.verifyAssets(results);
        // if (!allVerified) {
        //     console.error(`有资源校验失败: ${results.filter((item) => !item.success)}`);
        //     // 处理资源校验失败的情况，比如提示用户校验失败，或者重试下载等
        //     return { success: false, error: `有资源校验失败: ${results.filter((item) => !item.success)}` };
        // }

        // 拷贝：将下载的资源文件复制到缓存目录
        const success = await this.m_dirMgr.copyTempToCache();
        if (!success) {
            console.error("复制临时文件夹到缓存文件夹失败");
            return { success: false, error: "复制临时文件夹到缓存文件夹失败" };
        }

        // 保存远程的 manifest 到本地
        this.m_manifestMgr.saveLocalManifest(remoteProjectManifest, remoteVersionManifest);
        // 更新搜索路径
        this.m_applier.updateSearchPaths();
        // 重启游戏
        this.m_applier.restartGame();
    }

}

