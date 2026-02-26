import HotUpdateFlow from "../hot-update-module/src/core/HotUpdateFlow";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HotUpdateScene extends cc.Component {
    protected onLoad(): void {
        this.launchGame();
    }

    protected start(): void {
        cc.game.on("UPDATE_PROGRESSION", this.onUpdateProgression, this);
    }

    protected onDestroy(): void {
        cc.game.off("UPDATE_PROGRESSION", this.onUpdateProgression, this);
    }

    /** 启动游戏 */
    private async launchGame(): Promise<void> {

        // 检查热更新
        if (cc.sys.isNative) {
            const hotUpdateFlow = new HotUpdateFlow();
            const needUpdate = await hotUpdateFlow.checkHotUpdate();
            console.log(`是否需要热更新: ${needUpdate}`);
            if (needUpdate) {
                const result = await hotUpdateFlow.hotUpdateFlow();
                if (!result.success) {
                    // 热更新失败，提示用户重试                    
                }
            } else {
                // 切换到游戏场景
                cc.director.loadScene("main");
            }
        }

    }


    /** 热更新进度回调 */
    private onUpdateProgression(data: { totalTasks: number, completedTasks: number, totalBytes: number, finishedBytes: number }): void {
        const { totalTasks, completedTasks, totalBytes, finishedBytes } = data;
        console.log(`热更新进度任务数量进度: ${completedTasks}/${totalTasks}`);
        console.log(`热更新进度大小进度: ${finishedBytes}/${totalBytes} bytes`);
    }
}
