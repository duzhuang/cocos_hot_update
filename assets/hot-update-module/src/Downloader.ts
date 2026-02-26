import { IDownloadResult } from "./interfaces/IDownloadResult";
import { IDownloadTask } from "./interfaces/IDownloadTask";
import { IHotUpdateResource } from "./interfaces/IHotUpdateResource";




/** 
 * 下载器类
 * 负责下载资源文件
 */
export default class Downloader {
    /** 下载器实例 */
    private m_downloader: jsb.Downloader;
    /** 总任务数 */
    private m_totalTasks: number = 0;
    /** 已完成任务数 */
    private m_finishedTasks: number = 0;
    /** 总字节数 */
    private m_totalBytes: number = 0;
    /** 已完成字节数 */
    private m_finishedBytes: number = 0;

    /**全局绑定 */
    private taskMap = new Map<string, { resolve: Function, reject: Function }>();


    // 构造函数 绑定一次全局回调
    constructor() {
        this.m_downloader = new jsb.Downloader();

        this.m_downloader.setOnFileTaskSuccess(async (task) => {
            const handler = this.taskMap.get(task.identifier);
            if (handler) { 
                this.m_finishedTasks++;
                handler.resolve(task);
                this.taskMap.delete(task.identifier);
                cc.game.emit("UPDATE_PROGRESSION", {
                    totalTasks: this.m_totalTasks,
                    finishedTasks: this.m_finishedTasks,
                    totalBytes: this.m_totalBytes,
                    finishedBytes: this.m_finishedBytes,                   
                });
            }
        });

        this.m_downloader.setOnTaskError((task) => {
            const handler = this.taskMap.get(task.identifier);
            if (handler) {
                this.m_finishedTasks++;
                handler.reject(task);
                this.taskMap.delete(task.identifier);
                cc.game.emit("UPDATE_PROGRESSION", {
                    totalTasks: this.m_totalTasks,
                    finishedTasks: this.m_finishedTasks,
                    totalBytes: this.m_totalBytes,
                    finishedBytes: this.m_finishedBytes,                   
                });
            }
        });

        this.m_downloader.setOnTaskProgress((task, bytesReceived, totalBytes) => {
            const percent = (bytesReceived / totalBytes) * 100;
            console.log(`下载任务 ${task.identifier} 进度: ${percent.toFixed(2)}%`);
            // 更新总字节数和已完成字节数            
            this.m_finishedBytes += bytesReceived;
            cc.game.emit("UPDATE_PROGRESSION", {
                totalTasks: this.m_totalTasks,
                finishedTasks: this.m_finishedTasks,
                totalBytes: this.m_totalBytes,
                finishedBytes: this.m_finishedBytes,                   
            });
        });
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
    public async downloadAssets(tasks: IDownloadTask[], totalBytes: number): Promise<IDownloadResult[]> {

        this.m_totalTasks = tasks.length;
        this.m_totalBytes = totalBytes;
        this.m_finishedTasks = 0;
        this.m_finishedBytes = 0;        

        // 为每个任务创建一个Promise
        const downloadPromises = tasks.map(task => {
            return this.createDownloadPromise(task);
        });

        // 等待所有任务完成
        const results = await Promise.allSettled(downloadPromises);

        const downloadResults: IDownloadResult[] = [];

        for (const result of results) {
            if (result.status === "fulfilled") {
                downloadResults.push(result.value);
            } else if (result.status === "rejected") {
                downloadResults.push({
                    relativePath: result.reason.relativePath,
                    success: false,
                    error: result.reason.error,
                });
            }
        }

        return downloadResults;
    }

    /**
     * 创建重试下载任务
     * @param relativePath 资源相对路径
     * @returns 重试下载任务列表
     */
    createRetryDownloadTasks(failedTasks: IDownloadResult[]): IDownloadTask[]{
        return failedTasks.map(task => ({
            url: task.relativePath,
            relativePath: task.relativePath,
            storagePath: this.getTempFilePath(task.relativePath),
        }));
    }

    /**
     * 重试失败的下载任务
     * @param failedTasks 失败的下载任务列表
     * @param maxRetryTimes 最大重试次数
     * @returns 重试结果列表
     */
    async retryFailedDownloads(failedTasks: IDownloadTask[],maxRetryTimes: number = 3): Promise<IDownloadResult[]> {
        let attempts = 0; 
        let currentFailed = failedTasks; 
        const finalResults: IDownloadResult[] = [];

        while (attempts < maxRetryTimes && currentFailed.length > 0) {
            attempts++;
            console.log(`开始第 ${attempts} 次重试，任务数: ${currentFailed.length}`);
            const retryPromises = currentFailed.map(task => this.createDownloadPromise(task));
            const results = await Promise.allSettled(retryPromises);

            const newFailed: IDownloadTask[] = [];
            results.forEach((result, index) => {
                if (result.status === "fulfilled") {
                    finalResults.push(result.value);
                } else if (result.status === "rejected") {
                    // 保留失败任务，下一轮继续重试
                    newFailed.push({
                        url: result.reason.url,
                        relativePath: result.reason.relativePath,
                        storagePath: result.reason.storagePath,
                    })
                }
            });
            currentFailed = newFailed;
        }

        // 最终仍然失败的任务也要返回
        for (const task of currentFailed) {
            finalResults.push({
                relativePath: task.relativePath,
                success: false,
                error: `重试失败`,
            });
        }

        return finalResults;
    }


    //==================================================== 私有函数

    /**
     * 
     * @param task 下载任务
     * @returns 下载结果Promise
     */
    private createDownloadPromise(task: IDownloadTask): Promise<IDownloadResult> {

        return new Promise((resolve, reject) => {
            const donwloadTask = this.m_downloader.createDownloadFileTask(
                task.url,
                task.storagePath,
                task.relativePath,
            )

            this.taskMap.set(task.relativePath, { resolve, reject });
        })
    }


    /** 
     * 获取临时文件路径
     * @param relativePath 资源文件的相对路径
     * @returns 临时文件路径
     */
    private getTempFilePath(relativePath: string): string {
        const tempDir = jsb.fileUtils.getWritablePath() + "hotUpdateTemp/";
        if (!jsb.fileUtils.isDirectoryExist(tempDir)) {
            jsb.fileUtils.createDirectory(tempDir);
        }
        return tempDir + relativePath;
    }
}