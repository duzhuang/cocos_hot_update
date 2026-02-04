/**
 * 简化Logger工具类 - 劫持Editor.log输出
 * 专为Cocos Creator编辑器插件设计
 */
class Logger {

    constructor(name = 'HotUpdate') {
        this.name = name;
    }

    /**
     * 格式化日志消息
     */
    formatMessage(message) {
        const timestamp = new Date().toLocaleTimeString();
        return `[${timestamp}] [${this.name}] ${message}`;
    }

    logNormal(...args) {
        const formatted = this.formatMessage(args.join(' '));
        const logObj = this.checkIsEditor();
        logObj.log(formatted);
    }    

    logYellow(...args) {
        const formatted = this.formatMessage(args.join(' '));
        const logObj = this.checkIsEditor();
        logObj.warn(formatted);
    }

    logRed(...args) {
        const formatted = this.formatMessage(args.join(' '));
        const logObj = this.checkIsEditor();
        logObj.error(formatted);
    }

    logGreen(...args) {
        const formatted = this.formatMessage(args.join(' '));
        const logObj = this.checkIsEditor();
        logObj.success ? logObj.success(formatted) : logObj.log(formatted);
    }

    checkIsEditor() {
        if (typeof Editor !== "undefined") {
            return Editor;
        } else {
            return console;
        }
    }
}

// 导出默认实例
const logger = new Logger('HotUpdate');

module.exports = logger;