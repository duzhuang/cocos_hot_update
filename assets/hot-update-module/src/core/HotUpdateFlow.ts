import Decompressor from "../Decompressor";
import Downloader from "../Downloader";
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
        const { localProjectManifest, localVersionManifest } = manifestMgr.loadLocalManifest();
        dirMgr.prepareUpdateDirectories();

        // 下载远程 version_.manifest 文件, 并对比版本号
        const remoteVersionManifest = await manifestMgr.downloadRemoteVersionManifest(localVersionManifest.remoteVersionUrl);
        if (!manifestMgr.needUpdate(versionManifest.version, remoteVersionManifest.version)) return;

        // 下载远程 project_manifest 文件, 并对比差异
        const remoteProjectManifest = await manifestMgr.downloadRemoteProjectManifest(remoteVersion.remoteManifestUrl);
        const diffMap = manifestMgr.generateDiffMap(remoteProjectManifest);

        const tasks = downloader.createDownloadTasks(diffMap);
        const results = await downloader.downloadAssets(tasks);

        if (!verifier.verifyAssets(results)) {
            return handleUpdateError();
        }

        const decompressed = decompressor.decompressAssets(results);
        dirMgr.copyTempToCache();

        manifestMgr.saveLocalManifest(remoteManifest);
        applier.updateSearchPaths();
        applier.restartGame();
    }

}

