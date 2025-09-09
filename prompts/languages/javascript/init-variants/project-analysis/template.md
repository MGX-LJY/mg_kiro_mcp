# JavaScript项目分析模板 (Init Step1)

## 🎯 JavaScript项目特定分析
针对JavaScript/Node.js项目的详细分析，识别JavaScript生态系统的特殊需求和架构模式。

## 📦 JavaScript生态系统分析

### 1. 包管理系统识别
检测并分析JavaScript包管理配置：

#### package.json分析重点
```json
{
  "name": "{{project_name}}",
  "version": "{{project_version}}",
  "main": "{{entry_point}}",
  "scripts": {
    "start": "{{start_command}}",
    "test": "{{test_command}}",
    "build": "{{build_command}}"
  },
  "dependencies": {
    // 生产依赖分析
  },
  "devDependencies": {
    // 开发依赖分析
  }
}
```

#### 关键配置项检查
- **Node.js版本要求**: {{node_version_requirement}}
- **包管理器类型**: {{package_manager}} (npm/yarn/pnpm)
- **私有registry**: {{private_registry_used}}
- **Workspaces配置**: {{monorepo_setup}}

### 2. 框架和库识别
深入分析JavaScript技术栈：

#### 前端框架识别
```javascript
// React项目特征
const reactIndicators = [
  'react', 'react-dom', 'jsx', '.jsx files',
  'react-scripts', 'create-react-app'
];

// Vue项目特征  
const vueIndicators = [
  'vue', '@vue/cli', '.vue files',
  'vue-router', 'vuex', 'pinia'
];

// Angular项目特征
const angularIndicators = [
  '@angular/core', 'angular.json',
  '.component.ts', '@angular/cli'
];

检测结果: {{frontend_framework}}
```

#### 后端框架识别
```javascript
// Express.js特征
const expressIndicators = [
  'express', 'app.js', 'server.js',
  'middleware', 'routes'
];

// NestJS特征
const nestIndicators = [
  '@nestjs/core', 'main.ts',
  '.controller.ts', '.service.ts'
];

// Fastify特征
const fastifyIndicators = [
  'fastify', 'plugins', 'hooks'
];

检测结果: {{backend_framework}}
```

## 🏗️ JavaScript架构模式识别

### 1. 项目结构模式
识别常见的JavaScript项目结构：

#### MVC模式 (Express.js常用)
```
src/
├── controllers/    # 控制器层
├── models/        # 数据模型层
├── views/         # 视图层
├── routes/        # 路由定义
└── middleware/    # 中间件
```

检测到的架构模式: {{architecture_pattern}}

### 2. 状态管理分析
识别JavaScript应用的状态管理方案：

#### Redux生态系统
```javascript
// Redux相关依赖检测
const reduxPackages = [
  'redux', '@reduxjs/toolkit',
  'react-redux', 'redux-thunk',
  'redux-saga'
];
```

当前状态管理: {{state_management}}

## 🔧 JavaScript特定配置分析

### 1. 代码质量工具
检测JavaScript项目的代码质量配置：

#### ESLint配置
```json
// .eslintrc.json
{
  "extends": [{{eslint_extends}}],
  "rules": {{{eslint_rules}}},
  "parser": "{{eslint_parser}}"
}
```

#### TypeScript集成检查
```typescript
// TypeScript配置分析
interface ProjectConfig {
  hasTypeScript: {{has_typescript}};
  tsconfigPath: "{{tsconfig_path}}";
  typeDefinitions: {{type_definitions}};
  strictMode: {{typescript_strict}};
}
```

### 2. 测试框架配置
分析JavaScript测试设置：

#### 测试框架识别
```javascript
const testingFrameworks = {
  jest: {{has_jest}},
  mocha: {{has_mocha}},
  vitest: {{has_vitest}}
};
```

## 💡 JavaScript特定建议

### 1. 代码质量改进
基于检测结果的改进建议：

```javascript
const recommendations = {
  typescript: {{typescript_recommendation}},
  testing: {{testing_recommendations}},
  performance: {{performance_recommendations}},
  security: {{security_recommendations}}
};
```

## 📈 AI任务生成指导

### 1. JavaScript特定任务
为Step2生成的任务建议：

#### 高优先级任务
- **package.json分析**: 深入分析依赖和脚本
- **入口文件分析**: 分析main/index文件的架构设计
- **路由系统分析**: 分析路由配置
- **状态管理分析**: 分析状态流转和数据管理

---
*模板版本*: v4.0  
*适用模式*: Init - JavaScript变体  
*步骤*: Step1 - 项目分析  
*语言特化*: JavaScript/Node.js  
*生成时间*: {{timestamp}}