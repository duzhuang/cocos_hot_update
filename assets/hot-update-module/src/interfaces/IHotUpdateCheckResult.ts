import { IHotUpdateResource } from "./IHotUpdateResource";

export interface IHotUpdateCheckResult {
    /** 需要更新的资源 */
    updates: IHotUpdateResource[];
    /** 检查失败的资源 */
    failures: { relativePath: string; error: any }[];
}