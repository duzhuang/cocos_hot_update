import Decompressor from "../Decompressor";
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

    constructor() { }

    async hotUpdateFlow() {
        const manifestMgr = new ManifestManager();
        const dirMgr = new UpdateDirectoryManager();
        const downloader = new Downloader();
        const verifier = new Verifier();
        const decompressor = new Decompressor();
        const applier = new UpdateApplier();

        // 加载本地 manifest
        const {
            projectManifest: localProjectManifest,
            versionManifest: localVersionManifest
        } = manifestMgr.loadLocalManifest();
        dirMgr.prepareUpdateDirectories();

        // 下载远程 version_.manifest 文件, 并对比版本号
        const remoteVersionManifest = await manifestMgr.downloadRemoteVersionManifest(localVersionManifest.remoteVersionUrl);
        if (!manifestMgr.needUpdate(localVersionManifest.version, remoteVersionManifest.version)) return;

        // 下载远程 project_manifest 文件, 并对比差异
        const remoteProjectManifest = await manifestMgr.downloadRemoteProjectManifest(localVersionManifest.remoteManifestUrl);


        // 对比差异
        let diffMap: IHotUpdateResource[];
        try {
            diffMap = await manifestMgr.generateDiffMap(remoteProjectManifest, localProjectManifest);
        } catch (err) {
            console.error(`对比差异失败: ${err}`);
            // 处理对比差异失败
            return;
        }        

        // 创建下载任务
        const tasks = downloader.createDownloadTasks(diffMap);
        const results = await downloader.downloadAssets(tasks);      
        // 解压下载的资源
        const decompressed = decompressor.decompressAssets(results);        
        // 将解压后的资源复制到缓存目录
        dirMgr.copyTempToCache();
        // 保存远程的 manifest 到本地
        manifestMgr.saveLocalManifest(remoteProjectManifest, remoteVersionManifest);
        // 更新搜索路径
        applier.updateSearchPaths();
        // 重启游戏
        applier.restartGame();
    }

}

