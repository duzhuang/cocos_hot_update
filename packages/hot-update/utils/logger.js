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
        const logObj = this.getPrintObject();
        logObj.log(formatted);
    }    

    logYellow(...args) {
        const formatted = this.formatMessage(args.join(' '));
        const logObj = this.getPrintObject();
        logObj.warn(formatted);
    }

    logRed(...args) {
        const formatted = this.formatMessage(args.join(' '));
        const logObj = this.getPrintObject();
        logObj.error(formatted);
    }

    logGreen(...args) {
        const formatted = this.formatMessage(args.join(' '));
        const logObj = this.getPrintObject();
        logObj.success ? logObj.success(formatted) : logObj.log(formatted);
    }

    logBlue(...args) {
        const formatted = this.formatMessage(args.join(' '));
        const logObj = this.getPrintObject();
        logObj.info ? logObj.info(formatted) : logObj.log(formatted);
    }

    getPrintObject() {
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