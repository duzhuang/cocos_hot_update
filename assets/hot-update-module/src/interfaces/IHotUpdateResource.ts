import { IAssetInfo } from "./IAssetInfo";

export interface IHotUpdateResource {
    /** 资源相对路径 */
    relativePath: string;
    /** 资源信息 */
    assetInfo: IAssetInfo;
    /** 更新原因 */
    reason?: 'missing' | 'size_mismatch' | 'hash_mismatch';
}