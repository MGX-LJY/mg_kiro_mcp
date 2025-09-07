#!/usr/bin/env node

/**
 * 调试ProjectScanner的文件结构输出
 */

import { ProjectScanner } from './server/analyzers/project-scanner.js';
import { promises as fs } from 'fs';
import path from 'path';

async function debugProjectScanner() {
  console.log('🔍 调试ProjectScanner文件结构输出...\n');
  
  const projectScanner = new ProjectScanner();
  
  // 测试当前项目
  try {
    console.log('📋 测试当前项目 (.)');
    const result = await projectScanner.scanProject('.');
    
    console.log('\n=== 完整结果结构 ===');
    console.log('结果键:', Object.keys(result));
    
    console.log('\n=== structure字段详细信息 ===');
    if (result.structure) {
      console.log('structure键:', Object.keys(result.structure));
      console.log('结构路径:', result.structure.path);
      console.log('根目录文件数:', result.structure.files?.length || 0);
      console.log('根目录子目录数:', result.structure.directories?.length || 0);
      console.log('总文件数:', result.structure.totalFiles);
      console.log('总目录数:', result.structure.totalDirectories);
      
      // 显示前几个文件
      if (result.structure.files && result.structure.files.length > 0) {
        console.log('\n前5个文件:');
        result.structure.files.slice(0, 5).forEach((file, index) => {
          console.log(`  ${index + 1}. ${JSON.stringify(file)}`);
        });
      } else {
        console.log('⚠️ 根目录没有找到文件');
      }
      
      // 检查子目录
      if (result.structure.subdirectories) {
        console.log('\n子目录信息:');
        Object.keys(result.structure.subdirectories).forEach(dirName => {
          const subDir = result.structure.subdirectories[dirName];
          console.log(`  📁 ${dirName}:`);
          console.log(`    文件数: ${subDir.files?.length || 0}`);
          console.log(`    总文件数: ${subDir.totalFiles || 0}`);
          
          if (subDir.files && subDir.files.length > 0) {
            console.log(`    前3个文件: ${subDir.files.slice(0, 3).map(f => f.name).join(', ')}`);
          }
        });
      }
    } else {
      console.log('❌ 没有structure字段');
    }
    
    // 测试FileContentAnalyzer的数据提取
    console.log('\n=== 测试FileContentAnalyzer数据提取 ===');
    const { FileContentAnalyzer } = await import('./server/analyzers/file-content-analyzer.js');
    const analyzer = new FileContentAnalyzer();
    
    const extractedData = analyzer._extractProjectData({
      projectPath: path.resolve('.'),
      structure: result.structure,
      languageData: { primaryLanguage: 'javascript', confidence: 85 }
    });
    
    console.log('提取的文件数:', extractedData.files.length);
    if (extractedData.files.length > 0) {
      console.log('前5个提取的文件:');
      extractedData.files.slice(0, 5).forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.relativePath} (${file.fullPath})`);
      });
    } else {
      console.log('❌ FileContentAnalyzer没有提取到文件');
      console.log('调试信息:');
      console.log('  项目路径:', extractedData.projectPath);
      console.log('  结构存在:', !!extractedData.structure);
      console.log('  结构有文件:', !!extractedData.structure?.files);
      console.log('  结构有子目录:', !!extractedData.structure?.subdirectories);
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
  
  // 测试一个简单的测试项目
  console.log('\n📋 测试临时Python项目');
  try {
    // 创建临时测试目录
    const tempDir = './temp_debug_test';
    await fs.mkdir(tempDir, { recursive: true });
    
    // 创建测试文件
    await fs.writeFile(path.join(tempDir, 'app.py'), 'print("Hello World")');
    await fs.writeFile(path.join(tempDir, 'requirements.txt'), 'flask==2.0.0');
    
    const tempResult = await projectScanner.scanProject(tempDir);
    
    console.log('临时项目结果:');
    console.log('  根目录文件数:', tempResult.structure?.files?.length || 0);
    console.log('  总文件数:', tempResult.structure?.totalFiles || 0);
    
    if (tempResult.structure?.files) {
      console.log('  文件列表:');
      tempResult.structure.files.forEach((file, index) => {
        console.log(`    ${index + 1}. ${file.name} (${file.path})`);
      });
    }
    
    // 清理
    await fs.rm(tempDir, { recursive: true, force: true });
    
  } catch (error) {
    console.error('临时项目测试失败:', error);
  }
}

// 运行调试
debugProjectScanner().catch(console.error);