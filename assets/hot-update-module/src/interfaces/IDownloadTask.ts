/** 下载任务接口 */
export interface IDownloadTask {
    /** 资源文件的 URL */
    url: string;
    /** 资源文件的相对路径 */
    relativePath: string;
    /** 资源文件的本地存储路径 */
    storagePath: string;
}