/** 
 * 更新应用lier
 * 负责更新游戏搜索路径和重启游戏。
 */
export default class UpdateApplier {

    /** 持久化 searchPaths 的key */
    private m_localStorageKey: string = "HotUpdateSearchPaths";

    constructor() {

    }

    /** 
     * 更新搜索路径
     * @param updateSearchPath 更新后的搜索路径
     */
    updateSearchPaths(updateSearchPath: string = "hotUpdate/") {
        // 获取当前 searchPaths
        let searchPaths = jsb.fileUtils.getSearchPaths();
        // 构造本地资源路径
        let localPath = jsb.fileUtils.getWritablePath() + updateSearchPath;

        // 检查是否已经添加了本地资源路径
        if (searchPaths.includes(localPath)) {
            console.log("modifySearchPaths：本地资源路径已添加到 searchPaths 中：", localPath);
            return;
        }
        // 添加到 searchPaths 开头
        searchPaths.unshift(localPath);
        // 设置新的 searchPaths
        jsb.fileUtils.setSearchPaths(searchPaths);

        // 持久化保存 热更新目录到本地存储，因为必须在 引擎启动的最早阶段（main.js）恢复之前保存的 searchPaths。
        cc.sys.localStorage.setItem(this.m_localStorageKey, JSON.stringify(jsb.fileUtils.getSearchPaths()));
    }

    /** 重启游戏 */
    restartGame() {
        cc.game.restart();
    }
}