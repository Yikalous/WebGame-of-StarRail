class EventSystem {
    constructor() {
        this.listeners = new Map();
        this.eventHistory = [];
    }

    /**
     * 注册事件监听器
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     * @param {Object} options - 选项 {once: boolean, priority: number}
     */
    on(eventName, callback, options = {}) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }

        const listener = {
            callback,
            once: options.once || false,
            priority: options.priority || 0
        };

        this.listeners.get(eventName).push(listener);
        this.listeners.get(eventName).sort((a, b) => b.priority - a.priority);
    }

    /**
     * 注册一次性事件监听器
     */
    once(eventName, callback, priority = 0) {
        this.on(eventName, callback, { once: true, priority });
    }

    /**
     * 触发事件
     * @param {string} eventName - 事件名称
     * @param {Object} eventData - 事件数据
     * @returns {Object} 触发结果 {cancelled: boolean, results: Array, cancelledBy: string}
     */
    trigger(eventName, eventData = {}) {
        console.log(`🔔 触发事件: ${eventName}`, eventData);

        // 记录事件历史
        this.eventHistory.push({
            name: eventName,
            data: eventData,
            timestamp: Date.now()
        });

        if (this.eventHistory.length > 100) {
            this.eventHistory.shift();
        }

        const listeners = this.listeners.get(eventName);
        if (!listeners) {
            return { cancelled: false, results: [], cancelledBy: null };
        }

        // 创建事件对象，包含取消功能
        const eventObject = {
            name: eventName,
            data: eventData,
            timestamp: Date.now(),
            cancelled: false,
            cancelReason: null,
            cancel: function(reason = "事件被取消") {
                this.cancelled = true;
                this.cancelReason = reason;
                console.log(`❌ 事件 ${this.name} 被取消: ${reason}`);
            }
        };

        const results = [];
        const remainingListeners = [];
        let cancelledBy = null;

        for (const listener of listeners) {
            // 如果事件已被取消，停止执行后续监听器
            if (eventObject.cancelled) {
                console.log(`⏹️ 事件 ${eventName} 已取消，跳过后续监听器`);
                cancelledBy = eventObject.cancelReason;
                break;
            }

            try {
                const result = listener.callback(eventObject);
                results.push(result);

                // 如果不是一次性监听器，保留
                if (!listener.once) {
                    remainingListeners.push(listener);
                }
            } catch (error) {
                console.error(`事件监听器执行错误 (${eventName}):`, error);
            }
        }

        // 更新监听器列表
        this.listeners.set(eventName, remainingListeners);

        return {
            cancelled: eventObject.cancelled,
            results: results,
            cancelledBy: cancelledBy,
            event: eventObject
        };
    }

    /**
     * 移除事件监听器
     */
    off(eventName, callback) {
        const listeners = this.listeners.get(eventName);
        if (!listeners) return;

        const filtered = listeners.filter(listener => listener.callback !== callback);
        this.listeners.set(eventName, filtered);
    }

    /**
     * 移除所有指定事件的监听器
     */
    offAll(eventName) {
        this.listeners.delete(eventName);
    }

    /**
     * 检查是否有指定事件的监听器
     */
    hasListeners(eventName) {
        const listeners = this.listeners.get(eventName);
        return listeners && listeners.length > 0;
    }

    /**
     * 获取事件历史（用于调试）
     */
    getEventHistory(limit = 10) {
        return this.eventHistory.slice(-limit);
    }

    /**
     * 清空所有监听器
     */
    clear() {
        this.listeners.clear();
    }
}

// 创建全局事件系统实例
window.eventSystem = new EventSystem();
window.EventSystem = EventSystem;