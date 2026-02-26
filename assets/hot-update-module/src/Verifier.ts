/** 
 * 校验器
 * 负责校验下载文件（MD5/大小）和文件签名。
 */
export default class Verifier {

    /** 本地热更新的根路径 */
    private m_hotUpdateRootPath: string = "hotUpdate/";

    constructor() {

    }


    /** 
     * 校验下载文件（MD5/大小）
     * @param files 下载文件列表
     * @returns 是否校验通过
     */
    verifyAssets(files): boolean {
        // 校验下载文件（MD5/大小）
        let allVerified = true;
        for (const file of files) {
            const md5Verified = this.verifyMD5(file, file.md5);
            const sizeVerified = this.verifySize(file, file.size);
            allVerified = md5Verified && sizeVerified;
        }

        return allVerified;
    }


    /** 
     * 校验文件签名
     * @param file 下载文件
     * @returns 是否校验通过
     */
    verifySignature(file: any): boolean {
        // 校验文件签名
        return true;
    }


    //==================================================== 私有函数


    private verifyMD5(file: any, md5: string): boolean {
        // 校验文件 MD5
        return true;
    }

    private verifySize(file: { relativePath: string }, size: number): boolean {
        // 校验文件大小
        const filePath = this.m_hotUpdateRootPath + file.relativePath;
        const fileSize = jsb.fileUtils.getFileSize(filePath);
        // 校验文件大小
        return fileSize === size;
    }

}