/**
 * 服务注册配置
 * 定义所有服务的注册信息和依赖关系
 */

import { getServiceBus } from './service-bus.js';
import ConfigService from './config-service.js';
import { PromptManager } from '../prompt-manager.js';
import { ProjectScanner } from '../analyzers/project-scanner.js';

import { EnhancedLanguageDetector } from '../analyzers/enhanced-language-detector.js';
import { FileContentAnalyzer } from '../analyzers/file-content-analyzer.js';
import UnifiedTemplateService from './unified-template-service.js';
import LanguageIntelligenceService from './language-intelligence-service.js';
import TemplateReader from './template-reader.js';
import InitStateService from './init-state-service.js';
import { ClaudeCodeInitService } from './claude-code-init-service.js';

/**
 * 注册所有系统服务到ServiceBus
 * 定义服务依赖关系，实现依赖注入
 */
export function registerServices(configDir = './config') {
    const serviceBus = getServiceBus();

    // 基础服务层（无依赖）
    serviceBus
        .register('templateReader', TemplateReader, {}, [])
        .register('configService', ConfigService, { configDir }, [])
        .register('initState', InitStateService, {}, [])
        .register('claudeCodeInit', ClaudeCodeInitService, {}, []);

    // 核心服务层（依赖基础服务）
    serviceBus
        .register('promptManager', PromptManager, {
            version: '2.0.0',
            cacheEnabled: true,
            watchFiles: true
        }, ['templateReader'])
        
        .register('projectScanner', ProjectScanner, {
            maxDepth: 4,
            excludePatterns: ['.git', 'node_modules', '.DS_Store', '*.log']
        }, [])
        
        .register('enhancedLanguageDetector', EnhancedLanguageDetector, {}, [])
        .register('fileContentAnalyzer', FileContentAnalyzer, {}, [])
        
        .register('languageIntelligence', LanguageIntelligenceService, {}, []);

    // 高级服务层（依赖核心服务）
    serviceBus
        .register('unifiedTemplateService', UnifiedTemplateService, {}, [
            'templateReader', 
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
        promptManager: serviceBus.get('promptManager'),
        projectScanner: serviceBus.get('projectScanner'),
        initState: serviceBus.get('initState'),
        claudeCodeInit: serviceBus.get('claudeCodeInit'),
        languageDetector: serviceBus.get('enhancedLanguageDetector'),
        fileAnalyzer: serviceBus.get('fileContentAnalyzer'),
        unifiedTemplateService: serviceBus.get('unifiedTemplateService'),
        configService: serviceBus.get('configService'),
        
        // ServiceBus工具方法
        getService: (name) => serviceBus.get(name),
        getServiceStatus: (name) => serviceBus.getServiceStatus(name),
        getStats: () => serviceBus.getStats()
    };
}

export default { registerServices, initializeServices, getServices };