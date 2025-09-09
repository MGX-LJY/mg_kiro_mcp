#!/usr/bin/env node

/**
 * Init模式统一执行工具
 * 一键执行Init模式所有8个步骤
 * 
 * 使用方法:
 * node tools/init-all.js /path/to/project
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';

// 导入各个分析器
import IntelligentLayeredAnalyzer from '../server/analyzers/intelligent-layered-analyzer.js';
import ArchitectureKeyExtractor from '../server/analyzers/architecture-key-extractor.js';
import { EnhancedLanguageDetector } from '../server/analyzers/enhanced-language-detector.js';
import { FileContentAnalyzer } from '../server/analyzers/file-content-analyzer.js';
import GeneralizedDocumentGenerator from '../server/document-generators/generalized-document-generator.js';
import { ModuleAnalyzer } from '../server/analyzers/module-analyzer.js';
import { PromptManager } from '../server/prompt-manager.js';
import TemplateReader from '../server/services/template-reader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 执行Init流程的所有步骤
 */
async function executeInitFlow(projectPath) {
  console.log(chalk.blue('\n🚀 开始Init模式完整流程\n'));
  console.log(chalk.gray(`项目路径: ${projectPath}\n`));
  
  const results = {};
  const startTime = Date.now();

  try {
    // 验证项目路径
    const stats = await fs.stat(projectPath);
    if (!stats.isDirectory()) {
      throw new Error('提供的路径不是一个有效的目录');
    }
    
    // 创建mg_kiro目录结构
    const mgKiroPath = resolve(projectPath, 'mg_kiro');
    await createMgKiroStructure(mgKiroPath);

    // 步骤1: 项目结构分析
    console.log(chalk.yellow('\n📁 步骤1: 项目结构分析'));
    const layeredAnalyzer = new IntelligentLayeredAnalyzer(projectPath);
    const architectureExtractor = new ArchitectureKeyExtractor(projectPath);
    
    const [layeredResults, architectureKeys] = await Promise.all([
      layeredAnalyzer.performLayeredAnalysis(),
      architectureExtractor.extractArchitectureKeys()
    ]);
    
    results.step1 = {
      layeredResults,
      architectureKeys,
      timestamp: new Date().toISOString()
    };
    console.log(chalk.green('✅ 项目结构分析完成'));
    
    // 步骤2: 智能语言识别
    console.log(chalk.yellow('\n🔍 步骤2: 智能语言识别'));
    const languageDetector = new EnhancedLanguageDetector(projectPath);
    const languageResults = await languageDetector.detectLanguageEnhanced(
      projectPath,
      results.step1,
      {
        contextData: {
          architectureInsights: layeredResults.architectureAnalysis,
          moduleInsights: layeredResults.moduleAnalysis
        }
      }
    );
    
    results.step2 = {
      languageResults,
      primaryLanguage: languageResults.detection?.primaryLanguage || 'unknown',
      frameworks: languageResults.detection?.frameworks || [],
      timestamp: new Date().toISOString()
    };
    console.log(chalk.green(`✅ 语言识别完成: ${results.step2.primaryLanguage}`));
    
    // 步骤3: 文件内容通读
    console.log(chalk.yellow('\n📖 步骤3: 文件内容通读'));
    const fileAnalyzer = new FileContentAnalyzer(projectPath);
    const fileAnalysisResults = await fileAnalyzer.performDeepAnalysis({
      contextData: {
        structureAnalysis: results.step1,
        languageData: results.step2
      }
    });
    
    results.step3 = {
      fileAnalysisResults,
      totalFiles: fileAnalysisResults.totalFiles || 0,
      timestamp: new Date().toISOString()
    };
    console.log(chalk.green(`✅ 文件分析完成: ${results.step3.totalFiles} 个文件`));
    
    // 步骤4: 生成基础架构文档
    console.log(chalk.yellow('\n📝 步骤4: 生成基础架构文档'));
    const documentGenerator = new GeneralizedDocumentGenerator(projectPath);
    const architectureDoc = await documentGenerator.generateSystemArchitecture({
      projectPath,
      analysisResults: {
        structure: results.step1,
        language: results.step2,
        files: results.step3
      }
    });
    
    results.step4 = {
      document: architectureDoc,
      saved: await saveDocument(mgKiroPath, 'system-architecture.md', architectureDoc),
      timestamp: new Date().toISOString()
    };
    console.log(chalk.green('✅ 架构文档生成完成'));
    
    // 步骤5: 深度模块分析
    console.log(chalk.yellow('\n🔬 步骤5: 深度模块分析'));
    const moduleAnalyzer = new ModuleAnalyzer(projectPath);
    const moduleAnalysisResults = await moduleAnalyzer.analyzeModules({
      contextData: {
        projectStructure: results.step1,
        languageInfo: results.step2,
        fileAnalysis: results.step3
      }
    });
    
    results.step5 = {
      moduleAnalysisResults,
      totalModules: moduleAnalysisResults.modules?.length || 0,
      timestamp: new Date().toISOString()
    };
    console.log(chalk.green(`✅ 模块分析完成: ${results.step5.totalModules} 个模块`));
    
    // 步骤6: 语言特定提示词生成
    console.log(chalk.yellow('\n💡 步骤6: 语言特定提示词生成'));
    const templateReader = new TemplateReader();
    const promptManager = new PromptManager({ templateReader });
    
    const prompts = await promptManager.generateLanguageSpecificPrompts(
      results.step2.primaryLanguage,
      {
        frameworks: results.step2.frameworks,
        projectType: results.step1.architectureKeys?.projectType || 'general'
      }
    );
    
    results.step6 = {
      prompts,
      saved: await saveDocument(mgKiroPath, 'language-prompts.md', prompts),
      timestamp: new Date().toISOString()
    };
    console.log(chalk.green('✅ 提示词生成完成'));
    
    // 步骤7: 单独模块文档生成
    console.log(chalk.yellow('\n📚 步骤7: 单独模块文档生成'));
    const moduleDocs = await generateModuleDocs(
      results.step5.moduleAnalysisResults,
      documentGenerator
    );
    
    results.step7 = {
      moduleDocs,
      totalDocs: moduleDocs.length,
      saved: await saveModuleDocs(mgKiroPath, moduleDocs),
      timestamp: new Date().toISOString()
    };
    console.log(chalk.green(`✅ 模块文档生成完成: ${results.step7.totalDocs} 个文档`));
    
    // 步骤8: 集成契约文档生成
    console.log(chalk.yellow('\n🔗 步骤8: 集成契约文档生成'));
    const contractsDoc = await documentGenerator.generateIntegrationContracts({
      modules: results.step5.moduleAnalysisResults,
      architecture: results.step4.document,
      dependencies: results.step3.fileAnalysisResults?.dependencies || {}
    });
    
    results.step8 = {
      document: contractsDoc,
      saved: await saveDocument(mgKiroPath, 'integration-contracts.md', contractsDoc),
      timestamp: new Date().toISOString()
    };
    console.log(chalk.green('✅ 集成契约文档生成完成'));
    
    // 生成总结报告
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const summary = generateSummary(results, duration);
    await saveDocument(mgKiroPath, 'init-summary.md', summary);
    
    console.log(chalk.blue('\n\n🎉 Init模式执行完成！\n'));
    console.log(chalk.white('📊 执行摘要:'));
    console.log(chalk.gray(`  - 总耗时: ${duration} 秒`));
    console.log(chalk.gray(`  - 分析文件: ${results.step3.totalFiles} 个`));
    console.log(chalk.gray(`  - 检测语言: ${results.step2.primaryLanguage}`));
    console.log(chalk.gray(`  - 分析模块: ${results.step5.totalModules} 个`));
    console.log(chalk.gray(`  - 生成文档: ${4 + results.step7.totalDocs} 个`));
    console.log(chalk.gray(`  - 文档位置: ${mgKiroPath}`));
    
    return results;
    
  } catch (error) {
    console.error(chalk.red('\n❌ Init流程执行失败:'), error.message);
    throw error;
  }
}

/**
 * 创建mg_kiro目录结构
 */
async function createMgKiroStructure(mgKiroPath) {
  const dirs = [
    mgKiroPath,
    resolve(mgKiroPath, 'architecture'),
    resolve(mgKiroPath, 'modules'),
    resolve(mgKiroPath, 'prompts'),
    resolve(mgKiroPath, 'contracts')
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * 保存文档
 */
async function saveDocument(mgKiroPath, filename, content) {
  const subdir = filename.includes('module-') ? 'modules' :
                filename.includes('contract') ? 'contracts' :
                filename.includes('prompt') ? 'prompts' :
                'architecture';
                
  const filePath = resolve(mgKiroPath, subdir, filename);
  await fs.writeFile(filePath, content, 'utf8');
  return filePath;
}

/**
 * 生成模块文档
 */
async function generateModuleDocs(moduleAnalysisResults, documentGenerator) {
  const docs = [];
  const modules = moduleAnalysisResults.modules || [];
  
  for (const module of modules.slice(0, 10)) { // 限制最多10个模块文档
    const doc = await documentGenerator.generateModuleDoc(module);
    docs.push({
      name: `module-${module.name}.md`,
      content: doc
    });
  }
  
  return docs;
}

/**
 * 保存模块文档
 */
async function saveModuleDocs(mgKiroPath, moduleDocs) {
  const savedPaths = [];
  
  for (const doc of moduleDocs) {
    const path = await saveDocument(mgKiroPath, doc.name, doc.content);
    savedPaths.push(path);
  }
  
  return savedPaths;
}

/**
 * 生成总结报告
 */
function generateSummary(results, duration) {
  return `# Init模式执行总结

## 执行信息
- 执行时间: ${new Date().toISOString()}
- 总耗时: ${duration} 秒

## 步骤执行结果

### 步骤1: 项目结构分析
- 状态: ✅ 完成
- 架构文件: ${results.step1.architectureKeys?.totalFiles || 0} 个
- 模块数量: ${results.step1.layeredResults?.moduleAnalysis?.totalModules || 0} 个

### 步骤2: 智能语言识别
- 状态: ✅ 完成
- 主语言: ${results.step2.primaryLanguage}
- 框架: ${results.step2.frameworks.join(', ') || '无'}

### 步骤3: 文件内容通读
- 状态: ✅ 完成
- 分析文件: ${results.step3.totalFiles} 个

### 步骤4: 生成基础架构文档
- 状态: ✅ 完成
- 文档: system-architecture.md

### 步骤5: 深度模块分析
- 状态: ✅ 完成
- 模块数量: ${results.step5.totalModules} 个

### 步骤6: 语言特定提示词生成
- 状态: ✅ 完成
- 文档: language-prompts.md

### 步骤7: 单独模块文档生成
- 状态: ✅ 完成
- 文档数量: ${results.step7.totalDocs} 个

### 步骤8: 集成契约文档生成
- 状态: ✅ 完成
- 文档: integration-contracts.md

## 生成文档清单
1. system-architecture.md - 系统架构文档
2. language-prompts.md - 语言特定提示词
3. integration-contracts.md - 集成契约文档
4. ${results.step7.totalDocs} 个模块文档
5. init-summary.md - 本总结文档

## 后续建议
1. 查看生成的文档，了解项目结构
2. 根据分析结果优化代码结构
3. 使用生成的提示词辅助开发
`;
}

// 主入口
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(chalk.yellow('使用方法: node tools/init-all.js /path/to/project'));
    process.exit(1);
  }
  
  const projectPath = resolve(args[0]);
  
  try {
    await executeInitFlow(projectPath);
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('执行失败:'), error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { executeInitFlow };