/** HTTP 配置接口 */
export interface HttpConfig {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    data?: any;
    timeout?: number;
    responseType?: XMLHttpRequestResponseType;
    withCredentials?: boolean;
}

/** 响应接口 */
export interface HttpResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    status?: number;
    statusText?: string;
}

/** HTTP 请求工具类 */
export default class HttpTool {

    // 默认配置
    private static defaultConfig: HttpConfig = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        timeout: 10000,
        responseType: 'text',
        withCredentials: false,
    };

    /**
     * 发送HTTP请求（Promise版本，推荐使用）
     */
    public static async request<T = any>(
        url: string,
        config?: Partial<HttpConfig>
    ): Promise<HttpResponse<T>> {
        return new Promise((resolve) => {
            this._request(url, config, (response) => {
                resolve(response);
            });
        });
    }

    /**
     * 发送HTTP请求（回调函数版本）
     * @deprecated 推荐使用 request() 方法
     */
    public static httpRequest(
        url: string,
        callback: (success: boolean, data?: string, error?: string) => void,
        config?: Partial<HttpConfig>
    ): void {
        this._request(url, config, (response) => {
            callback(response.success, response.data as string, response.error);
        });
    }

    /**
     * GET 请求快捷方法
     */
    public static async get<T = any>(
        url: string,
        params?: Record<string, any>,
        config?: Partial<HttpConfig>
    ): Promise<HttpResponse<T>> {
        const queryString = params ? this.buildQueryString(params) : '';
        const fullUrl = queryString ? `${url}?${queryString}` : url;

        return this.request(fullUrl, {
            ...config,
            method: 'GET',
        });
    }

    /**
     * POST 请求快捷方法
     */
    public static async post<T = any>(
        url: string,
        data?: any,
        config?: Partial<HttpConfig>
    ): Promise<HttpResponse<T>> {
        return this.request(url, {
            ...config,
            method: 'POST',
            data,
        });
    }

    /**
     * 内部请求实现
     */
    private static _request<T = any>(
        url: string,
        userConfig?: Partial<HttpConfig>,
        callback?: (response: HttpResponse<T>) => void
    ): void {
        const config = { ...this.defaultConfig, ...userConfig };
        const xhr = new XMLHttpRequest();

        xhr.timeout = config.timeout!;
        xhr.responseType = config.responseType!;
        xhr.withCredentials = config.withCredentials!;

        // 监听状态变化
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                const response = this.handleResponse<T>(xhr);
                callback?.(response);
            }
        };

        // 监听错误
        xhr.onerror = () => {
            const response: HttpResponse<T> = {
                success: false,
                error: '网络错误，请检查网络连接',
                status: xhr.status,
                statusText: xhr.statusText,
            };
            callback?.(response);
        };

        // 监听超时
        xhr.ontimeout = () => {
            const response: HttpResponse<T> = {
                success: false,
                error: '请求超时，请稍后重试',
                status: xhr.status,
                statusText: xhr.statusText,
            };
            callback?.(response);
        };

        // 打开连接
        xhr.open(config.method!, url, true);

        // 设置请求头
        Object.entries(config.headers || {}).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
        });

        // 发送请求
        let requestData = config.data;
        if (config.data && typeof config.data === 'object') {
            requestData = JSON.stringify(config.data);
        }

        xhr.send(requestData);
    }

    /**
     * 处理响应
     */
    private static handleResponse<T = any>(xhr: XMLHttpRequest): HttpResponse<T> {
        const isSuccess = xhr.status >= 200 && xhr.status < 300;

        if (isSuccess) {
            let data: any;
            try {
                const responseText = xhr.responseText.trim();
                data = responseText ? JSON.parse(responseText) : null;
            } catch (error) {
                data = xhr.responseText;
            }

            return {
                success: true,
                data,
                status: xhr.status,
                statusText: xhr.statusText,
            };
        }

        return {
            success: false,
            error: `HTTP ${xhr.status}: ${xhr.statusText}`,
            status: xhr.status,
            statusText: xhr.statusText,
        };
    }

    /**
     * 构建查询字符串
     */
    private static buildQueryString(params: Record<string, any>): string {
        return Object.entries(params)
            .filter(([_, value]) => value != null)
            .map(([key, value]) => {
                const encodedValue = encodeURIComponent(
                    typeof value === 'object' ? JSON.stringify(value) : value
                );
                return `${encodeURIComponent(key)}=${encodedValue}`;
            })
            .join('&');
    }

    /**
     * 设置默认配置
     */
    public static setDefaultConfig(config: Partial<HttpConfig>): void {
        Object.assign(this.defaultConfig, config);
    }

    /**
     * 创建可取消的请求
     */
    public static createCancelableRequest<T = any>(
        url: string,
        config?: Partial<HttpConfig>
    ) {
        let xhr: XMLHttpRequest | null = null;
        let isCanceled = false;

        const promise = new Promise<HttpResponse<T>>((resolve, reject) => {
            xhr = new XMLHttpRequest();
            const finalConfig = { ...this.defaultConfig, ...config };

            xhr.onreadystatechange = () => {
                if (isCanceled) return;
                if (xhr!.readyState === 4) {
                    const response = this.handleResponse<T>(xhr!);
                    if (response.success) {
                        resolve(response);
                    } else {
                        reject(new Error(response.error));
                    }
                }
            };

            xhr.onerror = () => {
                if (!isCanceled) {
                    reject(new Error('网络错误'));
                }
            };

            xhr.ontimeout = () => {
                if (!isCanceled) {
                    reject(new Error('请求超时'));
                }
            };

            xhr.open(finalConfig.method!, url, true);

            Object.entries(finalConfig.headers || {}).forEach(([key, value]) => {
                xhr!.setRequestHeader(key, value);
            });

            xhr.timeout = finalConfig.timeout!;
            xhr.responseType = finalConfig.responseType!;
            xhr.withCredentials = finalConfig.withCredentials!;

            let requestData = finalConfig.data;
            if (requestData && typeof requestData === 'object') {
                requestData = JSON.stringify(requestData);
            }

            xhr.send(requestData);
        });

        const cancel = () => {
            if (xhr && !isCanceled) {
                isCanceled = true;
                xhr.abort();
            }
        };

        return { promise, cancel };
    }
}