/**
 * 服务注册配置
 * 定义所有服务的注册信息和依赖关系
 */

import { getServiceBus } from './service-bus.js';
import ConfigService from './config-service.js';
import AITodoManager from './ai-todo-manager.js';
import CompleteTaskMonitor from './complete-task-monitor.js';

import LanguageDetector from '../language/detector.js';
import LanguageIntelligenceService from './language-intelligence-service.js';
import { ProjectOverviewGenerator } from './project-overview-generator.js';
import { FileQueryService } from './file-query-service.js';
// 已删除: import InitStateService from './init-state-service.js';
// 已删除: import { ClaudeCodeInitService } from './claude-code-init-service.js';

// 新的统一模板系统
import MasterTemplateService from './unified/master-template-service.js';
import TemplateConfigManager from './unified/template-config-manager.js';
import ModeTemplateService from './unified/mode-template-service.js';

// 文件分析模块
import { FileAnalysisModule } from './file-analysis/FileAnalysisModule.js';
import { PreciseTokenCalculator } from './file-analysis/token-analysis/PreciseTokenCalculator.js';
import { CombinedFileBatchStrategy } from './file-analysis/batch-strategies/CombinedFileBatchStrategy.js';
import { SingleFileBatchStrategy } from './file-analysis/batch-strategies/SingleFileBatchStrategy.js';
import { LargeFileMultiBatchStrategy } from './file-analysis/batch-strategies/LargeFileMultiBatchStrategy.js';

// 任务管理模块
import { UnifiedTaskManager } from './task-management/UnifiedTaskManager.js';
import { UnifiedTaskValidator } from './task-management/UnifiedTaskValidator.js';
import { TaskStateManager } from './task-management/TaskStateManager.js';

/**
 * 注册所有系统服务到ServiceBus
 * 定义服务依赖关系，实现依赖注入
 */
export function registerServices(configDir = './config') {
    const serviceBus = getServiceBus();

    // 基础服务层（无依赖）
    serviceBus
        .register('configService', ConfigService, configDir, []);
        // 已删除: .register('initState', InitStateService, {}, [])
        // 已删除: .register('claudeCodeInit', ClaudeCodeInitService, {}, [])

    // 新的统一模板系统（基础层）
    serviceBus
        .register('templateConfigManager', TemplateConfigManager, {}, []);

    // 核心服务层（依赖基础服务）
    serviceBus
        .register('languageDetector', LanguageDetector, {}, [])
        
        .register('languageIntelligence', LanguageIntelligenceService, {}, [])
        .register('aiTodoManager', AITodoManager, {}, [])
        .register('completeTaskMonitor', CompleteTaskMonitor, {}, [])
        .register('projectOverviewGenerator', ProjectOverviewGenerator, {}, [])
        .register('fileQueryService', FileQueryService, {}, []);

    // 文件分析模块层（依赖基础服务）
    serviceBus
        .register('preciseTokenCalculator', PreciseTokenCalculator, {}, [])
        .register('combinedFileBatchStrategy', CombinedFileBatchStrategy, {}, [])
        .register('singleFileBatchStrategy', SingleFileBatchStrategy, {}, [])
        .register('largeFileMultiBatchStrategy', LargeFileMultiBatchStrategy, {}, [])
        .register('taskStateManager', TaskStateManager, {}, []);

    // 文件分析模块核心（依赖Token计算器和批次策略）
    serviceBus
        .register('fileAnalysisModule', FileAnalysisModule, {}, [
            'preciseTokenCalculator',
            'combinedFileBatchStrategy',
            'singleFileBatchStrategy',
            'largeFileMultiBatchStrategy'
        ]);

    // 任务管理模块（依赖文件分析模块）
    serviceBus
        .register('unifiedTaskValidator', UnifiedTaskValidator, {}, [
            'fileAnalysisModule'
        ])
        .register('unifiedTaskManager', UnifiedTaskManager, {}, [
            'taskStateManager',
            'unifiedTaskValidator'
        ]);

    // 高级服务层（依赖核心服务）
    serviceBus
        .register('masterTemplateService', MasterTemplateService, {}, [
            'templateConfigManager',
            'languageIntelligence'
        ])
        .register('modeTemplateService', ModeTemplateService, {
            enableCache: true,
            enableIntelligence: true,
            defaultLanguage: 'general'
        }, [
            'templateConfigManager',
            'languageIntelligence'
        ]);

    console.log('[ServiceRegistry] 所有服务已注册到ServiceBus');
    
    // 验证依赖关系
    const validation = serviceBus.validateDependencies();
    if (!validation.valid) {
        console.error('[ServiceRegistry] 依赖关系验证失败:', validation.errors);
        throw new Error('服务依赖关系配置错误');
    }

    console.log('[ServiceRegistry] 服务依赖关系验证通过');
    return serviceBus;
}

/**
 * 初始化所有服务
 */
export async function initializeServices(configDir = './config') {
    console.log('[ServiceRegistry] 开始初始化服务系统...');
    
    const serviceBus = registerServices(configDir);
    await serviceBus.initializeAll();
    
    // 设置相互依赖关系，避免构造函数中的循环依赖
    const masterTemplateService = serviceBus.get('masterTemplateService');
    const modeTemplateService = serviceBus.get('modeTemplateService');
    const languageIntelligence = serviceBus.get('languageIntelligence');
    
    if (masterTemplateService && languageIntelligence) {
        masterTemplateService.setLanguageIntelligence(languageIntelligence);
        languageIntelligence.setTemplateService(masterTemplateService);
        console.log('[ServiceRegistry] MasterTemplateService 交叉依赖关系设置完成');
    }
    
    if (modeTemplateService && languageIntelligence) {
        // ModeTemplateService 目前不需要设置交叉依赖，依赖注入已处理
        console.log('[ServiceRegistry] ModeTemplateService 依赖关系设置完成');
    }
    
    const stats = serviceBus.getStats();
    console.log(`[ServiceRegistry] 服务系统初始化完成，共 ${stats.initializedServices} 个服务`);
    
    return serviceBus;
}

/**
 * 获取服务容器（用于路由等外部调用）
 */
export function getServices() {
    const serviceBus = getServiceBus();
    
    return {
        // 新的统一模板系统
        masterTemplateService: serviceBus.get('masterTemplateService'),
        modeTemplateService: serviceBus.get('modeTemplateService'),
        templateConfigManager: serviceBus.get('templateConfigManager'),
        
        // 其他核心服务
        // 已删除: initState: serviceBus.get('initState'),
        // 已删除: claudeCodeInit: serviceBus.get('claudeCodeInit'),
        languageDetector: serviceBus.get('languageDetector'),
        languageIntelligence: serviceBus.get('languageIntelligence'),
        configService: serviceBus.get('configService'),
        
        // Create模式所需服务
        aiTodoManager: serviceBus.get('aiTodoManager'),
        completeTaskMonitor: serviceBus.get('completeTaskMonitor'),
        
        // Init模式所需服务
        projectOverviewGenerator: serviceBus.get('projectOverviewGenerator'),
        fileQueryService: serviceBus.get('fileQueryService'),
        
        // 新的文件分析模块和任务管理服务
        fileAnalysisModule: serviceBus.get('fileAnalysisModule'),
        unifiedTaskManager: serviceBus.get('unifiedTaskManager'),
        unifiedTaskValidator: serviceBus.get('unifiedTaskValidator'),
        taskStateManager: serviceBus.get('taskStateManager'),
        
        // 向后兼容的别名（指向新服务）
        promptService: serviceBus.get('masterTemplateService'), // promptManager 的替代
        unifiedTemplateService: serviceBus.get('masterTemplateService'), // 保持兼容性
        
        // ServiceBus工具方法
        getService: (name) => serviceBus.get(name),
        getServiceStatus: (name) => serviceBus.getServiceStatus(name),
        getStats: () => serviceBus.getStats()
    };
}

export default { registerServices, initializeServices, getServices };