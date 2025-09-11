/**
 * 重构组件服务注册扩展
 * 注册新的file-analysis和task-management模块服务
 */

import { getServiceBus } from './service-bus.js';

// File Analysis Module 组件
import { FileAnalysisModule } from './file-analysis/FileAnalysisModule.js';
import { PreciseTokenCalculator } from './file-analysis/token-analysis/PreciseTokenCalculator.js';
import { CodeStructureAnalyzer } from './file-analysis/token-analysis/CodeStructureAnalyzer.js';
import { FunctionBoundaryDetector } from './file-analysis/token-analysis/FunctionBoundaryDetector.js';
import { CombinedFileBatchStrategy } from './file-analysis/batch-strategies/CombinedFileBatchStrategy.js';
import { SingleFileBatchStrategy } from './file-analysis/batch-strategies/SingleFileBatchStrategy.js';
import { LargeFileMultiBatchStrategy } from './file-analysis/batch-strategies/LargeFileMultiBatchStrategy.js';
import { TaskDefinitionGenerator } from './file-analysis/task-generators/TaskDefinitionGenerator.js';
import { TaskProgressTracker } from './file-analysis/task-generators/TaskProgressTracker.js';

// Task Management Module 组件
import { UnifiedTaskValidator } from './task-management/UnifiedTaskValidator.js';
import { UnifiedTaskManager } from './task-management/UnifiedTaskManager.js';
import { TaskStateManager } from './task-management/TaskStateManager.js';
import { Step3FolderValidator } from './task-management/validation-strategies/Step3FolderValidator.js';
import { Step4ModuleValidator } from './task-management/validation-strategies/Step4ModuleValidator.js';
import { Step5FixedFileValidator } from './task-management/validation-strategies/Step5FixedFileValidator.js';
import { Step6ArchitectureValidator } from './task-management/validation-strategies/Step6ArchitectureValidator.js';

/**
 * 注册重构组件服务到ServiceBus
 * @param {Object} config - 配置参数
 */
export function registerRefactoringServices(config = {}) {
    const serviceBus = getServiceBus();
    console.log('[RefactoringServices] 开始注册重构组件服务...');

    // === File Analysis Module 基础组件 ===
    serviceBus
        .register('preciseTokenCalculator', PreciseTokenCalculator, {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            enableCaching: true,
            ...config.tokenCalculator
        }, [])

        .register('codeStructureAnalyzer', CodeStructureAnalyzer, {
            enableComplexityAnalysis: true,
            maxAnalysisDepth: 10,
            ...config.codeStructureAnalyzer
        }, [])

        .register('functionBoundaryDetector', FunctionBoundaryDetector, {
            minChunkSize: 1000,
            maxChunkSize: 25000,
            ...config.functionBoundaryDetector
        }, []);

    // === Batch Strategies ===
    serviceBus
        .register('combinedFileBatchStrategy', CombinedFileBatchStrategy, {
            targetBatchSize: 18000,
            maxBatchSize: 22000,
            ...config.combinedBatchStrategy
        }, [])

        .register('singleFileBatchStrategy', SingleFileBatchStrategy, {
            optimalTokenRange: [15000, 20000],
            ...config.singleBatchStrategy
        }, [])

        .register('largeFileMultiBatchStrategy', LargeFileMultiBatchStrategy, {
            chunkTargetSize: 15000,
            ...config.largeBatchStrategy
        }, ['functionBoundaryDetector']);

    // === Task Generators ===
    serviceBus
        .register('taskDefinitionGenerator', TaskDefinitionGenerator, {
            enablePriorityOptimization: true,
            ...config.taskGenerator
        }, [])

        .register('taskProgressTracker', TaskProgressTracker, {
            enableRealTimeTracking: true,
            ...config.progressTracker
        }, []);

    // === FileAnalysisModule (协调模块) ===
    serviceBus
        .register('fileAnalysisModule', FileAnalysisModule, {
            smallFileThreshold: 15000,
            largeFileThreshold: 20000,
            batchTargetSize: 18000,
            ...config.fileAnalysisModule
        }, [
            'preciseTokenCalculator',
            'codeStructureAnalyzer', 
            'functionBoundaryDetector',
            'combinedFileBatchStrategy',
            'singleFileBatchStrategy',
            'largeFileMultiBatchStrategy',
            'taskDefinitionGenerator',
            'taskProgressTracker'
        ]);

    // === Task Management 验证器 ===
    serviceBus
        .register('step3FolderValidator', Step3FolderValidator, {
            filesFolderName: 'files',
            mgKiroFolderName: 'mg_kiro',
            ...config.step3Validator
        }, [])

        .register('step4ModuleValidator', Step4ModuleValidator, {
            modulesFolderName: 'modules',
            mgKiroFolderName: 'mg_kiro',
            ...config.step4Validator
        }, [])

        .register('step5FixedFileValidator', Step5FixedFileValidator, {
            requiredFileName: 'relations.md',
            mgKiroFolderName: 'mg_kiro',
            ...config.step5Validator
        }, [])

        .register('step6ArchitectureValidator', Step6ArchitectureValidator, {
            requiredFiles: ['README.md', 'architecture.md'],
            mgKiroFolderName: 'mg_kiro',
            ...config.step6Validator
        }, []);

    // === Task State Manager ===
    serviceBus
        .register('taskStateManager', TaskStateManager, {
            storagePath: config.taskStateStoragePath || 'temp',
            ...config.taskStateManager
        }, []);

    // === Unified Task Validator ===
    serviceBus
        .register('unifiedTaskValidator', UnifiedTaskValidator, {
            enableAutoCompletion: true,
            timeoutMs: 10000,
            ...config.unifiedTaskValidator
        }, [
            'step3FolderValidator',
            'step4ModuleValidator',
            'step5FixedFileValidator',
            'step6ArchitectureValidator'
        ]);

    // === Unified Task Manager (顶层协调器) ===
    serviceBus
        .register('unifiedTaskManager', UnifiedTaskManager, {
            ...config.unifiedTaskManager
        }, [
            'unifiedTaskValidator',
            'taskStateManager'
        ]);

    console.log('[RefactoringServices] 重构组件服务注册完成');
    return serviceBus;
}

/**
 * 初始化重构组件服务
 * 设置依赖注入关系
 */
export async function initializeRefactoringServices() {
    console.log('[RefactoringServices] 初始化重构组件服务...');
    
    const serviceBus = getServiceBus();
    
    // 获取所有服务实例
    const services = {
        fileAnalysisModule: serviceBus.get('fileAnalysisModule'),
        unifiedTaskValidator: serviceBus.get('unifiedTaskValidator'),
        unifiedTaskManager: serviceBus.get('unifiedTaskManager'),
        taskStateManager: serviceBus.get('taskStateManager'),
        
        // Token analysis
        tokenCalculator: serviceBus.get('preciseTokenCalculator'),
        codeStructureAnalyzer: serviceBus.get('codeStructureAnalyzer'),
        boundaryDetector: serviceBus.get('functionBoundaryDetector'),
        
        // Batch strategies
        combinedStrategy: serviceBus.get('combinedFileBatchStrategy'),
        singleStrategy: serviceBus.get('singleFileBatchStrategy'),
        largeMultiStrategy: serviceBus.get('largeFileMultiBatchStrategy'),
        
        // Task generators
        taskGenerator: serviceBus.get('taskDefinitionGenerator'),
        progressTracker: serviceBus.get('taskProgressTracker'),
        
        // Validators
        step3Validator: serviceBus.get('step3FolderValidator'),
        step4Validator: serviceBus.get('step4ModuleValidator'),
        step5Validator: serviceBus.get('step5FixedFileValidator'),
        step6Validator: serviceBus.get('step6ArchitectureValidator')
    };

    // FileAnalysisModule 依赖注入
    if (services.fileAnalysisModule) {
        services.fileAnalysisModule.injectDependencies({
            tokenCalculator: services.tokenCalculator,
            codeStructureAnalyzer: services.codeStructureAnalyzer,
            boundaryDetector: services.boundaryDetector,
            combinedStrategy: services.combinedStrategy,
            singleStrategy: services.singleStrategy,
            largeMultiStrategy: services.largeMultiStrategy,
            taskGenerator: services.taskGenerator,
            progressTracker: services.progressTracker
        });
        console.log('[RefactoringServices] FileAnalysisModule 依赖注入完成');
    }

    // UnifiedTaskValidator 依赖注入
    if (services.unifiedTaskValidator) {
        services.unifiedTaskValidator.injectDependencies({
            unifiedTaskManager: services.unifiedTaskManager,
            taskStateManager: services.taskStateManager,
            fileAnalysisModule: services.fileAnalysisModule,
            step3Validator: services.step3Validator,
            step4Validator: services.step4Validator,
            step5Validator: services.step5Validator,
            step6Validator: services.step6Validator
        });
        console.log('[RefactoringServices] UnifiedTaskValidator 依赖注入完成');
    }

    // TaskStateManager 初始化
    if (services.taskStateManager) {
        await services.taskStateManager.initialize();
        console.log('[RefactoringServices] TaskStateManager 初始化完成');
    }

    console.log('[RefactoringServices] 重构组件服务初始化完成');
    return services;
}

/**
 * 获取重构组件服务容器
 */
export function getRefactoringServices() {
    const serviceBus = getServiceBus();
    
    return {
        // 主要协调模块
        fileAnalysisModule: serviceBus.get('fileAnalysisModule'),
        unifiedTaskManager: serviceBus.get('unifiedTaskManager'),
        unifiedTaskValidator: serviceBus.get('unifiedTaskValidator'),
        taskStateManager: serviceBus.get('taskStateManager'),
        
        // Token analysis components
        preciseTokenCalculator: serviceBus.get('preciseTokenCalculator'),
        codeStructureAnalyzer: serviceBus.get('codeStructureAnalyzer'),
        functionBoundaryDetector: serviceBus.get('functionBoundaryDetector'),
        
        // Batch strategies
        combinedFileBatchStrategy: serviceBus.get('combinedFileBatchStrategy'),
        singleFileBatchStrategy: serviceBus.get('singleFileBatchStrategy'),
        largeFileMultiBatchStrategy: serviceBus.get('largeFileMultiBatchStrategy'),
        
        // Task generators
        taskDefinitionGenerator: serviceBus.get('taskDefinitionGenerator'),
        taskProgressTracker: serviceBus.get('taskProgressTracker'),
        
        // Step validators
        step3FolderValidator: serviceBus.get('step3FolderValidator'),
        step4ModuleValidator: serviceBus.get('step4ModuleValidator'),
        step5FixedFileValidator: serviceBus.get('step5FixedFileValidator'),
        step6ArchitectureValidator: serviceBus.get('step6ArchitectureValidator'),
        
        // 工具方法
        getService: (name) => serviceBus.get(name),
        getServiceStatus: (name) => serviceBus.getServiceStatus(name)
    };
}

export default { 
    registerRefactoringServices, 
    initializeRefactoringServices, 
    getRefactoringServices 
};