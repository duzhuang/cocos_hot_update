/** 下载结果接口 */
export interface IDownloadResult {
    relativePath: string;
    success: boolean;
    error?: string;
}