/** 版本清单 */
export interface IVersionManifest {
    /** 版本号 */
    version: string;
    /** 资源包url */
    packageUrl: string;
    /** 远程版本url */
    remoteVersionUrl: string;
    /** 远程清单url */
    remoteManifestUrl: string;
}