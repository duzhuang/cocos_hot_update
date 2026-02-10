import { IDownloadResult } from "./interfaces/IDownloadResult";
import { IDownloadTask } from "./interfaces/IDownLoadTask";
import { IHotUpdateResource } from "./interfaces/IHotUpdateResource";




/** 
 * 下载器类
 * 负责下载资源文件
 */
export default class Downloader {
    /** 下载器实例 */
    private downloader: jsb.Downloader;
    /** 下载结果列表 */
    private results: IDownloadResult[] = [];
    /** 总任务数 */
    private totalTasks: number = 0;
    /** 已完成任务数 */
    private finishedTasks: number = 0;


    constructor() {
        this.downloader = new jsb.Downloader();
        this.downloader.setOnFileTaskSuccess(this.onFileTaskSucess.bind(this));
        this.downloader.setOnTaskError(this.onTaskError.bind(this));
        this.downloader.setOnTaskProgress(this.onTaskProgress.bind(this));
    }

    /** 
     * 创建下载任务
     * @param resources 需要下载的资源列表
     * @returns 下载任务列表
     */
    createDownloadTasks(resources: IHotUpdateResource[]): IDownloadTask[] {
        return resources.map(res => {
            const storagePath = this.getTempFilePath(res.relativePath);
            return {
                url: res.relativePath,
                relativePath: res.relativePath,
                storagePath
            };
        });
    }


    /** 下载资源文件 */
    public async downloadAssets(tasks: IDownloadTask[]): Promise<IDownloadResult[]> {

        this.totalTasks = tasks.length;
        this.finishedTasks = 0;

        // 为每个任务创建一个Promise
        const downloadPromises = tasks.map(task => {
            this.downloader.createDownloadFileTask(task.url, task.storagePath, task.relativePath);
        });

        // 等待所有任务完成
        const results = await Promise.allSettled(downloadPromises);

        

        return [];

    }


    /** 重试失败的下载任务 */
    async retryFailedDownloads(failedTasks: IDownloadTask[]): Promise<IDownloadResult[]> {
        // 重试失败的下载任务
        return [] 
    }


    //==================================================== 私有函数

    /** 下载任务成功回调 */
    private onFileTaskSucess(task: IDownloadTask) {
        this.results.push({
            relativePath: task.relativePath,
            success: true,
        });
        this.finishedTasks++;
        console.log(`下载任务成功: ${task.relativePath}`);
    }

    /** 下载任务失败回调 */
    private onTaskError(task: IDownloadTask, error: string) {
        this.results.push({
            relativePath: task.relativePath,
            success: false,
            error,
        });
        this.finishedTasks++;
        cc.error(`下载失败: ${task.relativePath}, 错误: ${error}`);
    }

    /** 下载任务进度回调 */
    private onTaskProgress(task: IDownloadTask, bytesReceived: number, totalBytes: number) {
        const percent = (bytesReceived / totalBytes) * 100;
        cc.log(`下载进度: ${task.relativePath} ${percent.toFixed(2)}%`);
    }


    /** 
     * 获取临时文件路径
     * @param relativePath 资源文件的相对路径
     * @returns 临时文件路径
     */
    private getTempFilePath(relativePath: string): string {
        const tempDir = jsb.fileUtils.getWritablePath() + "hotUpdateTemp/";
        if(!jsb.fileUtils.isDirectoryExist(tempDir)) {
            jsb.fileUtils.createDirectory(tempDir);
        }
        return tempDir + relativePath;
    }
}