import { IAssetInfo } from "./IAssetInfo";

/** 项目清单 */
export interface IProjectManifest {
    /** 资源包url */
    packageUrl: string;
    /** 远程版本url */
    remoteVersionUrl: string;
    /** 远程清单url */
    remoteManifestUrl: string;
    /** 版本号 */
    version: string;
    /** 引擎版本号 */
    engineVersion: string;
    /** 资源清单 */
    assets: {
        [key: string]: IAssetInfo;
    }
    /** 搜索路径 */
    searchPaths: string[];
}