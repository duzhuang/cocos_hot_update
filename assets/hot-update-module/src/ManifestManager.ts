import HttpTool from "./http/HttpTool";
import { IAssetInfo } from "./interfaces/IAssetInfo";

import { IHotUpdateResource } from "./interfaces/IHotUpdateResource";
import { IProjectManifest } from "./interfaces/IProjectManifest";
import { IVersionManifest } from "./interfaces/IVersionManifest";
import Tools from "./Tools";

export default class ManifestManager {

    /** 本地 project_manifest 文件内容 */
    private m_lcoalProjectManifest: IProjectManifest;
    /** 本地 version_.manifest 文件内容 */
    private m_localVersionManifest: IVersionManifest;
    /** 本地热更新的根路径 */
    private m_hotUpdateRootPath: string = "hotUpdate/";

    constructor() {
        this.m_lcoalProjectManifest = {} as IProjectManifest;
        this.m_localVersionManifest = {} as IVersionManifest;
    }

    /** 加载本地 manifest */
    public loadLocalManifest(): { projectManifest: IProjectManifest, versionManifest: IVersionManifest } {        

        this.loadLocalProjectManifest();
        this.loadLocalVersionManifest();

        return {
            projectManifest: this.m_lcoalProjectManifest,
            versionManifest: this.m_localVersionManifest,
        }
    }

    /** 
     * 保存本地 manifest
     * @param projectManifest 项目 manifest
     * @param versionManifest 版本 manifest
    */
    public saveLocalManifest(projectManifest: IProjectManifest, versionManifest: IVersionManifest) {
        // 保存本地 manifest
    }

    /** 
     * 下载远程 project_manifest 文件
     * @param remoteProjectManifetUrl 远程 project_manifest 文件 url
     */
    public async downloadRemoteProjectManifest(remoteProjectManifetUrl: string): Promise<IProjectManifest> {
        if (!remoteProjectManifetUrl) {
            return {} as IProjectManifest;
        }


        const response = await HttpTool.request<IProjectManifest>(remoteProjectManifetUrl);
        if (response.success) {
            this.m_lcoalProjectManifest = response.data;

        } else {
            cc.error(`下载远程 project_manifest 文件失败: ${response.error}`);
            return {} as IProjectManifest;
        }
    }

    /** 
     * 下载远程 version_.manifest 文件
     * @param remoteVersionManifestUrl 远程 version_.manifest 文件 url
     */
    public async downloadRemoteVersionManifest(remoteVersionManifestUrl: string): Promise<IVersionManifest> {
        if (!remoteVersionManifestUrl) {
            return {} as IVersionManifest;
        }

        const response = await HttpTool.request<IVersionManifest>(remoteVersionManifestUrl);
        if (response.success) {
            this.m_localVersionManifest = response.data;

        } else {
            cc.error(`下载远程 version_.manifest 文件失败: ${response.error}`);
            return {} as IVersionManifest;
        }
    }


    /** 
     * 对比版本号
     * @param version1 版本号1
     * @param version2 版本号2
     * @returns -1 版本号1小于版本号2, 0 版本号1等于版本号2, 1 版本号1大于版本号2
     */
    public compareVersions(version1: string, version2: string): -1 | 0 | 1 {
        const v1Parts = version1.split('.').map(Number);
        const v2Parts = version2.split('.').map(Number);

        const maxLength = Math.max(v1Parts.length, v2Parts.length);

        for (let i = 0; i < maxLength; i++) {
            const v1Part = v1Parts[i] || 0;
            const v2Part = v2Parts[i] || 0;

            if (v1Part < v2Part) return -1;
            if (v1Part > v2Part) return 1;
        }

        return 0;
    }

    /** 
     * 是否需要更新
     * @param localVersion 本地版本号
     * @param remoteVersion 远程版本号
     * @returns 是否需要更新
     */
    public needUpdate(localVersion: string, remoteVersion: string): boolean {
        return this.compareVersions(localVersion, remoteVersion) < 0;
    }


    /** 
     * 生成差异映射表
     * @param remoteProjectManifest 远程 project_manifest 文件内容
     * @param localProjectManifest 本地 project_manifest 文件内容（可选）
     * @returns 差异映射表 IHotUpdateResource[]
     */
    public async generateDiffMap(remoteProjectManifest: IProjectManifest, localProjectManifest?: IProjectManifest): Promise<IHotUpdateResource[]> {
        if (!localProjectManifest) {
            localProjectManifest = this.m_lcoalProjectManifest;
        }

        if(!remoteProjectManifest || !remoteProjectManifest.assets) {
            return [] as IHotUpdateResource[];
        }

        try {
            const updateResources = await this.checkResourcesForUpdate(remoteProjectManifest.assets);
            return updateResources;
        } catch (error) {
            console.error(`generateDiffMap 执行失败: ${error}`);
            throw error;
        }
    }


    //==================================================== 私有函数

    /** 加载本地 project_manifest 文件 */
    private loadLocalProjectManifest() {
        // 检查是否已加载
        if(this.m_lcoalProjectManifest) {
            return this.m_lcoalProjectManifest;
        }

        // 优先从本地缓存加载
        const cacheManifest = Tools.loadCacheResource(this.m_hotUpdateRootPath + "project_manifest.json");
        if(cacheManifest) {
            this.m_lcoalProjectManifest = JSON.parse(cacheManifest);
            return this.m_lcoalProjectManifest;
        }

        // 从包内加载
        const packageManifest = Tools.loadPackageResource("project_manifest.json");
        if(packageManifest) {
            this.m_lcoalProjectManifest = JSON.parse(packageManifest);
            return this.m_lcoalProjectManifest;
        }

        return null;
    }

    /** 加载本地 version_.manifest 文件 */
    private loadLocalVersionManifest() {
        // 检查是否已加载
        if(this.m_localVersionManifest) {
            return this.m_localVersionManifest;
        }

        // 优先从本地缓存加载
        const cacheManifest = Tools.loadCacheResource(this.m_hotUpdateRootPath + "version_.manifest.json");
        if(cacheManifest) {
            this.m_localVersionManifest = JSON.parse(cacheManifest);
            return this.m_localVersionManifest;
        }

        // 从包内加载
        const packageManifest = Tools.loadPackageResource("version_.manifest.json");
        if(packageManifest) {
            this.m_localVersionManifest = JSON.parse(packageManifest);
            return this.m_localVersionManifest;
        }

        return null;
    }


    /**
     * 检查资源是否需要更新
     * @param assets 资源列表
     * @returns 需要更新的资源列表
     */
    private async checkResourcesForUpdate(assets: Record<string, IAssetInfo>): Promise<IHotUpdateResource[]> {

        if (!assets || Object.keys(assets).length === 0) {
            return [] as IHotUpdateResource[];
        }
               
        // 并行检查资源是否需要更新
        const checkTasks = Object.entries(assets).map(async ([relativePath, assetInfo]) => {
            try {
                const checkResult = await this.needResourceUpdate(relativePath, assetInfo);
                if (checkResult.needUpdate) {
                    return { relativePath, assetInfo, reason: checkResult.reason } as IHotUpdateResource;
                }
            } catch (error) {
                console.error(`检查资源失败: ${relativePath}, 错误: ${error}`);
                return null;
            }
        });

        // 等待所有任务完成 
        const results = await Promise.allSettled(checkTasks);  
        
        const updateResources: IHotUpdateResource[] = results
            .filter(r => r.status === "fulfilled" && r.value !== null)
            .map(r => (r as PromiseFulfilledResult<IHotUpdateResource>).value);

        return updateResources;
    }


    /**
     * 检查资源是否需要更新
     * @param relativePath 资源相对路径
     * @param assetInfo 资源信息
     * @returns 是否需要更新
     */
    private async needResourceUpdate(relativePath: string, assetInfo: IAssetInfo): Promise<
        { needUpdate: true; reason: 'missing' | 'size_mismatch' | 'hash_mismatch' }
        | { needUpdate: false }> {

        // 1. 检查本地文件是否存在
        const localAssetInfo = this.m_lcoalProjectManifest.assets[relativePath];
        if (!localAssetInfo) {
            return { needUpdate: true, reason: 'missing' };
        }

        // 2. 检查文件大小
        if (localAssetInfo.size !== assetInfo.size) {
            return { needUpdate: true, reason: 'size_mismatch' };
        }

        // 3. 检查文件哈希值（只在大小匹配时检查）
        if (localAssetInfo.md5 !== assetInfo.md5) {
            return { needUpdate: true, reason: 'hash_mismatch' };
        }

        // 4. 文件未改变，无需更新
        return { needUpdate: false };

    }

}