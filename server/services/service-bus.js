/**
 * ServiceBus - 统一服务管理中心
 * 解决循环依赖、提供依赖注入、管理服务生命周期
 */

class ServiceBus {
    constructor() {
        // 服务注册表
        this.services = new Map();
        this.serviceInstances = new Map();
        this.serviceConfigs = new Map();
        this.dependencyGraph = new Map();
        
        // 服务状态
        this.serviceStatus = new Map();
        this.initializationOrder = [];
        
        console.log('[ServiceBus] 服务总线初始化完成');
    }

    /**
     * 注册服务定义
     * @param {string} name - 服务名称
     * @param {Function} serviceClass - 服务类
     * @param {Object} config - 服务配置
     * @param {Array} dependencies - 依赖的服务列表
     */
    register(name, serviceClass, config = {}, dependencies = []) {
        if (this.services.has(name)) {
            throw new Error(`服务 ${name} 已经注册`);
        }

        this.services.set(name, serviceClass);
        this.serviceConfigs.set(name, config);
        this.dependencyGraph.set(name, dependencies);
        this.serviceStatus.set(name, 'registered');

        console.log(`[ServiceBus] 注册服务: ${name}, 依赖: [${dependencies.join(', ')}]`);
        return this;
    }

    /**
     * 获取服务实例（懒加载）
     * @param {string} name - 服务名称
     * @returns {Object} 服务实例
     */
    get(name) {
        if (!this.services.has(name)) {
            throw new Error(`未找到服务: ${name}`);
        }

        // 如果已经实例化，直接返回
        if (this.serviceInstances.has(name)) {
            return this.serviceInstances.get(name);
        }

        // 检查循环依赖
        this._checkCircularDependency(name, new Set());

        // 递归初始化依赖
        return this._initializeService(name);
    }

    /**
     * 初始化服务（内部方法）
     * @private
     */
    _initializeService(name) {
        if (this.serviceInstances.has(name)) {
            return this.serviceInstances.get(name);
        }

        console.log(`[ServiceBus] 正在初始化服务: ${name}`);
        this.serviceStatus.set(name, 'initializing');

        const ServiceClass = this.services.get(name);
        const config = this.serviceConfigs.get(name);
        const dependencies = this.dependencyGraph.get(name);

        // 初始化依赖服务
        const resolvedDependencies = {};
        for (const depName of dependencies) {
            resolvedDependencies[depName] = this._initializeService(depName);
        }

        try {
            // 创建服务实例，注入依赖
            const instance = new ServiceClass(config, resolvedDependencies, this);
            
            this.serviceInstances.set(name, instance);
            this.serviceStatus.set(name, 'initialized');
            this.initializationOrder.push(name);

            console.log(`[ServiceBus] 服务初始化完成: ${name}`);
            return instance;

        } catch (error) {
            this.serviceStatus.set(name, 'error');
            console.error(`[ServiceBus] 服务初始化失败: ${name}`, error);
            throw error;
        }
    }

    /**
     * 检查循环依赖
     * @private
     */
    _checkCircularDependency(serviceName, visiting) {
        if (visiting.has(serviceName)) {
            const cycle = Array.from(visiting).join(' -> ') + ' -> ' + serviceName;
            throw new Error(`检测到循环依赖: ${cycle}`);
        }

        visiting.add(serviceName);
        
        const dependencies = this.dependencyGraph.get(serviceName) || [];
        for (const dep of dependencies) {
            this._checkCircularDependency(dep, new Set(visiting));
        }
        
        visiting.delete(serviceName);
    }

    /**
     * 批量初始化所有服务
     */
    async initializeAll() {
        console.log('[ServiceBus] 开始批量初始化所有服务...');
        
        const serviceNames = Array.from(this.services.keys());
        const initialized = [];
        
        for (const serviceName of serviceNames) {
            try {
                if (!this.serviceInstances.has(serviceName)) {
                    this.get(serviceName);
                    initialized.push(serviceName);
                }
            } catch (error) {
                console.error(`[ServiceBus] 服务初始化失败: ${serviceName}`, error);
                throw error;
            }
        }

        console.log(`[ServiceBus] 批量初始化完成，共初始化 ${initialized.length} 个服务`);
        return initialized;
    }

    /**
     * 获取服务状态
     */
    getServiceStatus(name) {
        if (name) {
            return {
                name,
                status: this.serviceStatus.get(name) || 'not_found',
                dependencies: this.dependencyGraph.get(name) || [],
                hasInstance: this.serviceInstances.has(name)
            };
        }

        // 返回所有服务状态
        const allStatus = {};
        for (const [serviceName] of this.services) {
            allStatus[serviceName] = {
                status: this.serviceStatus.get(serviceName),
                dependencies: this.dependencyGraph.get(serviceName) || [],
                hasInstance: this.serviceInstances.has(serviceName)
            };
        }

        return allStatus;
    }

    /**
     * 获取依赖图
     */
    getDependencyGraph() {
        const graph = {};
        for (const [serviceName, deps] of this.dependencyGraph) {
            graph[serviceName] = deps;
        }
        return graph;
    }

    /**
     * 验证所有服务的依赖关系
     */
    validateDependencies() {
        const errors = [];
        
        for (const [serviceName, dependencies] of this.dependencyGraph) {
            for (const dep of dependencies) {
                if (!this.services.has(dep)) {
                    errors.push(`服务 ${serviceName} 依赖未注册的服务: ${dep}`);
                }
            }
        }

        // 检查循环依赖
        for (const serviceName of this.services.keys()) {
            try {
                this._checkCircularDependency(serviceName, new Set());
            } catch (error) {
                errors.push(error.message);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * 重置服务（用于测试）
     */
    reset() {
        this.serviceInstances.clear();
        this.serviceStatus.clear();
        this.initializationOrder.length = 0;
        
        // 重新设置为registered状态
        for (const serviceName of this.services.keys()) {
            this.serviceStatus.set(serviceName, 'registered');
        }
        
        console.log('[ServiceBus] 服务状态已重置');
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            totalServices: this.services.size,
            initializedServices: this.serviceInstances.size,
            initializationOrder: [...this.initializationOrder],
            serviceStatuses: Object.fromEntries(this.serviceStatus),
            dependencyCount: Array.from(this.dependencyGraph.values())
                .reduce((sum, deps) => sum + deps.length, 0)
        };
    }

    /**
     * 优雅关闭所有服务
     */
    async shutdown() {
        console.log('[ServiceBus] 开始关闭所有服务...');
        
        // 按照初始化的相反顺序关闭
        const shutdownOrder = [...this.initializationOrder].reverse();
        
        for (const serviceName of shutdownOrder) {
            const instance = this.serviceInstances.get(serviceName);
            if (instance && typeof instance.shutdown === 'function') {
                try {
                    await instance.shutdown();
                    console.log(`[ServiceBus] 服务已关闭: ${serviceName}`);
                } catch (error) {
                    console.error(`[ServiceBus] 服务关闭失败: ${serviceName}`, error);
                }
            }
        }

        this.reset();
        console.log('[ServiceBus] 所有服务已关闭');
    }
}

// 单例模式
let serviceBusInstance = null;

/**
 * 获取ServiceBus单例
 */
export function getServiceBus() {
    if (!serviceBusInstance) {
        serviceBusInstance = new ServiceBus();
    }
    return serviceBusInstance;
}

/**
 * 重置ServiceBus（仅用于测试）
 */
export function resetServiceBus() {
    if (serviceBusInstance) {
        serviceBusInstance.reset();
    }
    serviceBusInstance = null;
}

export default ServiceBus;