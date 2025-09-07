/**
 * 模板和文档生成单元测试
 * 测试契约文档模板加载、变量替换和文档生成功能
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';

describe('模板和文档生成测试', () => {
  let mockTemplateVars;
  let mockPromptService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 创建Mock模板变量
    mockTemplateVars = createMockTemplateVariables();
    
    // 创建Mock提示词服务
    mockPromptService = createMockPromptService();
  });

  afterEach(() => {
    global.cleanupMocks();
  });

  describe('契约文档模板', () => {
    test('应该成功加载集成契约模板', async () => {
      const template = await mockPromptService.loadPrompt(
        'templates',
        'integration-contracts',
        mockTemplateVars
      );

      expect(template).toBeDefined();
      expect(template.content).toBeDefined();
      expect(template.metadata).toBeDefined();
      expect(template.content.length).toBeGreaterThan(0);
    });

    test('应该正确替换模板变量', async () => {
      const template = await mockPromptService.loadPrompt(
        'templates',
        'integration-contracts',
        mockTemplateVars
      );

      const content = template.content;
      
      // 验证基本变量替换
      expect(content).toContain(mockTemplateVars.project_name);
      expect(content).toContain(mockTemplateVars.primary_language);
      expect(content).toContain(mockTemplateVars.total_modules.toString());
      expect(content).toContain(mockTemplateVars.generated_at);
    });

    test('应该处理复杂对象变量', async () => {
      const complexVars = {
        ...mockTemplateVars,
        module_relations: {
          modules: [
            { name: 'TestModule1', category: 'core', path: 'test1.js' },
            { name: 'TestModule2', category: 'service', path: 'test2.js' }
          ],
          statistics: {
            relationTypes: { 'core-service': 2, 'service-util': 1 },
            strongRelations: 1,
            weakRelations: 2
          }
        }
      };

      const template = await mockPromptService.loadPrompt(
        'templates',
        'integration-contracts',
        complexVars
      );

      expect(template.content).toBeDefined();
      // 验证复杂对象被正确处理（不包含 [object Object]）
      expect(template.content).not.toContain('[object Object]');
    });

    test('应该处理数组变量', async () => {
      const arrayVars = {
        ...mockTemplateVars,
        integration_points: [
          {
            id: 'point1',
            type: 'api',
            description: 'API集成点',
            complexity: 0.8
          },
          {
            id: 'point2', 
            type: 'service',
            description: '服务集成点',
            complexity: 0.6
          }
        ]
      };

      const template = await mockPromptService.loadPrompt(
        'templates',
        'integration-contracts',
        arrayVars
      );

      expect(template.content).toBeDefined();
      expect(template.content.length).toBeGreaterThan(100);
    });

    test('应该处理缺失变量', async () => {
      const incompleteVars = {
        project_name: 'TestProject',
        primary_language: 'javascript'
        // 缺少其他必需变量
      };

      const template = await mockPromptService.loadPrompt(
        'templates',
        'integration-contracts',
        incompleteVars
      );

      expect(template.content).toBeDefined();
      // 模板应该能够处理缺失变量，使用默认值或空字符串
      expect(template.content).not.toContain('undefined');
    });

    test('应该生成有效的Markdown文档', async () => {
      const template = await mockPromptService.loadPrompt(
        'templates',
        'integration-contracts',
        mockTemplateVars
      );

      const content = template.content;
      
      // 验证Markdown语法
      expect(content).toMatch(/^#\s+.+$/m); // 至少有一个标题
      expect(content).toMatch(/\*\*.+\*\*/); // 有粗体文本
      expect(content).toMatch(/^-\s+.+$/m); // 有列表项
    });

    test('应该包含Mermaid图表', async () => {
      const template = await mockPromptService.loadPrompt(
        'templates', 
        'integration-contracts',
        mockTemplateVars
      );

      const content = template.content;
      
      // 验证Mermaid代码块存在
      expect(content).toMatch(/```mermaid[\s\S]*?```/);
      expect(content).toContain('graph TD'); // 流程图
      expect(content).toContain('sequenceDiagram'); // 时序图
    });
  });

  describe('内置文档生成器', () => {
    test('应该生成基本契约文档', () => {
      const builtinDoc = _generateBuiltinContractDocument(mockTemplateVars);
      
      expect(builtinDoc).toBeDefined();
      expect(builtinDoc.length).toBeGreaterThan(500);
      expect(builtinDoc).toContain('# ' + mockTemplateVars.project_name);
      expect(builtinDoc).toContain('## 项目概览');
      expect(builtinDoc).toContain('## 系统架构摘要');
    });

    test('应该包含所有主要章节', () => {
      const builtinDoc = _generateBuiltinContractDocument(mockTemplateVars);
      
      const expectedSections = [
        '## 项目概览',
        '## 系统架构摘要',
        '## 核心指标',
        '## 模块关系图',
        '## 集成点分析',
        '## API契约规范',
        '## 数据流向分析',
        '## 外部依赖分析',
        '## 改进建议',
        '## 风险识别',
        '## 附录'
      ];

      expectedSections.forEach(section => {
        expect(builtinDoc).toContain(section);
      });
    });

    test('应该正确格式化数据', () => {
      const builtinDoc = _generateBuiltinContractDocument(mockTemplateVars);
      
      // 验证数字格式化
      expect(builtinDoc).toContain(`总模块数**: ${mockTemplateVars.total_modules}`);
      expect(builtinDoc).toContain(`模块关系**: ${mockTemplateVars.total_relations}`);
      
      // 验证日期格式化
      expect(builtinDoc).toContain(mockTemplateVars.generated_at);
    });

    test('应该处理空数据', () => {
      const emptyVars = {
        project_name: 'EmptyProject',
        primary_language: 'javascript',
        generated_at: new Date().toISOString(),
        total_modules: 0,
        total_relations: 0,
        integration_points_count: 0,
        api_contracts_count: 0,
        data_flows_count: 0,
        external_deps_count: 0,
        module_relations: { modules: [], statistics: {} },
        integration_points: [],
        api_contracts: { contracts: [], statistics: {} },
        data_flow: { statistics: { totalFlows: 0, dataTypes: [] } },
        external_dependencies: { statistics: { totalDependencies: 0 } },
        recommendations: [],
        risks: []
      };

      const builtinDoc = _generateBuiltinContractDocument(emptyVars);
      
      expect(builtinDoc).toBeDefined();
      expect(builtinDoc).toContain('未检测到明显的集成点');
      expect(builtinDoc).toContain('未检测到API契约');
    });

    test('应该生成有效的Markdown语法', () => {
      const builtinDoc = _generateBuiltinContractDocument(mockTemplateVars);
      
      // 验证标题层级
      expect(builtinDoc).toMatch(/^#\s[^#]/m); // H1标题
      expect(builtinDoc).toMatch(/^##\s[^#]/m); // H2标题
      expect(builtinDoc).toMatch(/^###\s[^#]/m); // H3标题
      
      // 验证列表语法
      expect(builtinDoc).toMatch(/^-\s+\*\*.+\*\*:/m); // 粗体列表项
      
      // 验证代码块
      expect(builtinDoc).toContain('```');
    });
  });

  describe('章节提取功能', () => {
    test('应该正确提取文档章节', () => {
      const sampleMarkdown = `# 主标题

## 第一章节
这是第一章节的内容。

### 子章节1
子章节内容。

## 第二章节
这是第二章节的内容。

### 子章节2
更多内容。

## 第三章节
最后的章节。`;

      const sections = _extractSections(sampleMarkdown);
      
      expect(sections).toHaveLength(4); // 主标题 + 3个章节
      
      expect(sections[0].title).toBe('主标题');
      expect(sections[0].level).toBe(1);
      
      expect(sections[1].title).toBe('第一章节');
      expect(sections[1].level).toBe(2);
      expect(sections[1].content).toContain('这是第一章节的内容');
      
      expect(sections[2].title).toBe('第二章节');
      expect(sections[2].level).toBe(2);
      
      expect(sections[3].title).toBe('第三章节');
      expect(sections[3].level).toBe(2);
    });

    test('应该处理空内容', () => {
      const sections = _extractSections('');
      expect(sections).toHaveLength(0);
    });

    test('应该处理只有内容没有标题的情况', () => {
      const contentOnly = '这是一些内容\n没有标题的文档\n多行内容';
      const sections = _extractSections(contentOnly);
      
      // 没有标题时应该返回空数组
      expect(sections).toHaveLength(0);
    });

    test('应该正确处理标题嵌套', () => {
      const nestedMarkdown = `# 主标题

## 二级标题

### 三级标题
内容

#### 四级标题
更多内容

## 另一个二级标题
结束`;

      const sections = _extractSections(nestedMarkdown);
      
      // 应该提取所有级别的标题
      expect(sections.length).toBeGreaterThan(0);
      expect(sections.some(s => s.level === 1)).toBe(true);
      expect(sections.some(s => s.level === 2)).toBe(true);
    });
  });

  describe('变量处理', () => {
    test('应该处理特殊字符', () => {
      const specialVars = {
        ...mockTemplateVars,
        project_name: 'Test & <Project>',
        primary_language: 'C++',
        description: 'Project with "quotes" and \'apostrophes\''
      };

      const builtinDoc = _generateBuiltinContractDocument(specialVars);
      
      expect(builtinDoc).toContain('Test & <Project>');
      expect(builtinDoc).toContain('C++');
      expect(builtinDoc).toContain('quotes');
    });

    test('应该处理中文字符', () => {
      const chineseVars = {
        ...mockTemplateVars,
        project_name: '测试项目',
        primary_language: 'JavaScript',
        description: '这是一个中文描述的项目'
      };

      const builtinDoc = _generateBuiltinContractDocument(chineseVars);
      
      expect(builtinDoc).toContain('测试项目');
      expect(builtinDoc).toContain('中文描述');
    });

    test('应该处理长文本', () => {
      const longText = 'A'.repeat(10000); // 10KB文本
      const longVars = {
        ...mockTemplateVars,
        project_overview: longText
      };

      const builtinDoc = _generateBuiltinContractDocument(longVars);
      
      expect(builtinDoc).toContain(longText);
      expect(builtinDoc.length).toBeGreaterThan(10000);
    });
  });

  describe('性能测试', () => {
    test('文档生成应该在合理时间内完成', async () => {
      const { duration } = await global.measureTime(async () => {
        return _generateBuiltinContractDocument(mockTemplateVars);
      });
      
      expect(duration).toBeLessThan(1000); // 1秒内完成
    });

    test('大型模板应该能够处理', async () => {
      const largeVars = {
        ...mockTemplateVars,
        module_relations: {
          modules: Array.from({ length: 1000 }, (_, i) => ({
            name: `Module${i}`,
            category: 'test',
            path: `module${i}.js`
          })),
          statistics: { totalModules: 1000 }
        }
      };

      const { result, duration } = await global.measureTime(async () => {
        return _generateBuiltinContractDocument(largeVars);
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(1000);
      expect(duration).toBeLessThan(5000); // 5秒内完成
    });
  });

  describe('错误处理', () => {
    test('应该处理null变量', () => {
      const nullVars = {
        project_name: null,
        primary_language: null,
        total_modules: null
      };

      expect(() => {
        _generateBuiltinContractDocument(nullVars);
      }).not.toThrow();
    });

    test('应该处理undefined变量', () => {
      const undefinedVars = {
        project_name: undefined,
        primary_language: undefined
      };

      expect(() => {
        _generateBuiltinContractDocument(undefinedVars);
      }).not.toThrow();
    });

    test('应该处理循环引用', () => {
      const circularVars = { ...mockTemplateVars };
      circularVars.self = circularVars; // 创建循环引用

      expect(() => {
        _generateBuiltinContractDocument(circularVars);
      }).not.toThrow();
    });
  });
});

/**
 * 创建Mock模板变量
 */
function createMockTemplateVariables() {
  return {
    project_name: 'TestProject',
    primary_language: 'javascript',
    generated_at: new Date().toISOString(),
    project_path: '/test/project',
    total_modules: 5,
    total_relations: 3,
    integration_points_count: 2,
    api_contracts_count: 1,
    data_flows_count: 4,
    external_deps_count: 6,
    
    project_overview: '这是一个测试项目的概览描述',
    architecture_summary: '系统架构摘要信息',
    
    module_relations: {
      modules: [
        { name: 'MainModule', category: 'core', path: 'main.js' },
        { name: 'ServiceModule', category: 'service', path: 'service.js' },
        { name: 'UtilModule', category: 'utility', path: 'util.js' }
      ],
      statistics: {
        relationTypes: { 'core-service': 2, 'service-util': 1 },
        strongRelations: 1,
        weakRelations: 2,
        totalRelations: 3
      }
    },
    
    integration_points: [
      {
        id: 'integration_1',
        type: 'api',
        description: 'REST API集成点',
        complexity: 0.7
      },
      {
        id: 'integration_2',
        type: 'service',
        description: '内部服务集成',
        complexity: 0.5
      }
    ],
    
    api_contracts: {
      contracts: [
        {
          name: 'UserAPI',
          contractType: 'REST',
          scope: 'external',
          version: '1.0'
        }
      ],
      statistics: {
        totalContracts: 1,
        restApis: 1,
        graphqlApis: 0,
        internalApis: 0,
        externalApis: 1
      }
    },
    
    data_flow: {
      statistics: {
        totalFlows: 4,
        synchronousFlows: 3,
        asynchronousFlows: 1,
        bidirectionalFlows: 1,
        dataTypes: ['user', 'config', 'response', 'error']
      }
    },
    
    external_dependencies: {
      statistics: {
        totalDependencies: 6,
        criticalDependencies: 2,
        securityRisks: 0,
        dependencyTypes: { 'framework': 2, 'utility': 3, 'builtin': 1 }
      }
    },
    
    recommendations: [
      {
        title: '优化模块结构',
        priority: 'medium',
        description: '建议重构模块以降低耦合度',
        impact: 'maintainability'
      },
      {
        title: '完善API文档',
        priority: 'high', 
        description: '为所有API端点添加完整文档',
        impact: 'integration'
      }
    ],
    
    risks: [
      {
        title: '单点故障',
        severity: 'medium',
        description: '核心服务模块存在单点故障风险',
        mitigation: '增加冗余设计和错误处理'
      }
    ]
  };
}

/**
 * 创建Mock提示词服务
 */
function createMockPromptService() {
  return {
    loadPrompt: jest.fn().mockImplementation(async (category, name, vars) => {
      // 模拟加载集成契约模板
      if (category === 'templates' && name === 'integration-contracts') {
        return {
          content: _generateBuiltinContractDocument(vars),
          metadata: {
            templateUsed: 'integration-contracts',
            variables: Object.keys(vars || {}),
            generatedAt: new Date().toISOString()
          }
        };
      }
      
      // 其他模板的基础实现
      return {
        content: `# Mock Template: ${name}\n\nContent with variables: ${JSON.stringify(vars, null, 2)}`,
        metadata: { template: name }
      };
    })
  };
}

/**
 * 内置契约文档生成器 (从contracts.js复制)
 */
function _generateBuiltinContractDocument(vars) {
  // 处理null/undefined变量
  const safeVars = {
    project_name: vars.project_name || 'Unknown Project',
    primary_language: vars.primary_language || 'Unknown',
    generated_at: vars.generated_at || new Date().toISOString(),
    project_path: vars.project_path || '/unknown/path',
    total_modules: vars.total_modules || 0,
    total_relations: vars.total_relations || 0,
    integration_points_count: vars.integration_points_count || 0,
    api_contracts_count: vars.api_contracts_count || 0,
    data_flows_count: vars.data_flows_count || 0,
    external_deps_count: vars.external_deps_count || 0,
    project_overview: vars.description || vars.project_overview || '项目概览信息',
    architecture_summary: vars.architecture_summary || '架构摘要信息',
    module_relations: vars.module_relations || { modules: [], statistics: {} },
    integration_points: vars.integration_points || [],
    api_contracts: vars.api_contracts || { contracts: [], statistics: {} },
    data_flow: vars.data_flow || { statistics: { totalFlows: 0, dataTypes: [] } },
    external_dependencies: vars.external_dependencies || { statistics: { totalDependencies: 0 } },
    recommendations: vars.recommendations || [],
    risks: vars.risks || []
  };

  return `# ${safeVars.project_name} - 集成契约文档

## 项目概览

**项目名称**: ${safeVars.project_name}  
**主要语言**: ${safeVars.primary_language}  
**生成时间**: ${safeVars.generated_at}  
**项目路径**: ${safeVars.project_path}

${safeVars.project_overview}

## 系统架构摘要

${safeVars.architecture_summary}

### 系统架构图
\`\`\`mermaid
graph TD
    A[用户请求] --> B[API网关]
    B --> C[业务逻辑层]
    C --> D[数据访问层]
    D --> E[(数据库)]
    
    F[外部服务] --> B
    B --> G[缓存层]
    G --> C
\`\`\`

### 核心指标

- **总模块数**: ${safeVars.total_modules}
- **模块关系**: ${safeVars.total_relations}
- **集成点**: ${safeVars.integration_points_count}
- **API契约**: ${safeVars.api_contracts_count}
- **数据流**: ${safeVars.data_flows_count}
- **外部依赖**: ${safeVars.external_deps_count}

## 模块关系图

### 模块依赖图
\`\`\`mermaid
graph TD
    ${safeVars.module_relations.modules.map(m => 
        `${m.name.replace(/[^a-zA-Z0-9]/g, '')}[${m.name}]`
    ).join('\n    ')}
    
    ${safeVars.module_relations.modules.map((m, i) => 
        i < safeVars.module_relations.modules.length - 1 ? 
        `${m.name.replace(/[^a-zA-Z0-9]/g, '')} --> ${safeVars.module_relations.modules[i+1].name.replace(/[^a-zA-Z0-9]/g, '')}` : 
        ''
    ).filter(Boolean).join('\n    ')}
\`\`\`

### 模块列表

${safeVars.module_relations.modules.map(m => 
    `- **${m.name}** (${m.category}): \`${m.path}\``
).join('\n')}

### 关系统计

${Object.entries(safeVars.module_relations.statistics.relationTypes || {}).map(([type, count]) => 
    `- ${type}: ${count}个`
).join('\n')}

## 集成点分析

### 集成时序图
\`\`\`mermaid
sequenceDiagram
    participant Client as 客户端
    participant API as API服务
    participant Service as 业务服务
    participant DB as 数据库
    
    Client->>API: 请求数据
    API->>Service: 处理业务逻辑
    Service->>DB: 查询数据
    DB-->>Service: 返回结果
    Service-->>API: 业务结果
    API-->>Client: 响应数据
\`\`\`

${safeVars.integration_points.length > 0 ? 
    safeVars.integration_points.map(point => 
        `### ${point.id}\n\n- **类型**: ${point.type}\n- **复杂度**: ${point.complexity}\n- **描述**: ${point.description}\n`
    ).join('\n') : 
    '未检测到明显的集成点。'
}

## API契约规范

${safeVars.api_contracts.contracts.length > 0 ?
    `### API统计\n\n${Object.entries(safeVars.api_contracts.statistics.contractTypes || {}).map(([type, count]) =>
        `- ${type}: ${count}个`
    ).join('\n')}\n\n### API端点示例\n\`\`\`json\n{\n  "endpoint": "/api/users",\n  "method": "GET",\n  "response": {\n    "status": 200,\n    "data": [\n      {\n        "id": 1,\n        "name": "用户示例"\n      }\n    ]\n  }\n}\n\`\`\`` :
    '未检测到API契约。'
}

## 数据流向分析

### 数据流图
\`\`\`mermaid
flowchart LR
    A[输入数据] --> B[数据验证]
    B --> C[业务处理]
    C --> D[数据存储]
    D --> E[输出结果]
    
    F[外部系统] --> A
    E --> G[缓存更新]
\`\`\`

### 数据流统计

- **总数据流**: ${safeVars.data_flow.statistics.totalFlows}
- **同步流**: ${safeVars.data_flow.statistics.synchronousFlows || 0}
- **异步流**: ${safeVars.data_flow.statistics.asynchronousFlows || 0}
- **双向流**: ${safeVars.data_flow.statistics.bidirectionalFlows || 0}

### 数据类型

${(safeVars.data_flow.statistics.dataTypes || []).map(type => `- ${type}`).join('\n')}

## 外部依赖分析

### 依赖统计

- **总依赖数**: ${safeVars.external_dependencies.statistics.totalDependencies}
- **关键依赖**: ${safeVars.external_dependencies.statistics.criticalDependencies || 0}
- **安全风险**: ${safeVars.external_dependencies.statistics.securityRisks || 0}

### 依赖类型分布

${Object.entries(safeVars.external_dependencies.statistics.dependencyTypes || {}).map(([type, count]) =>
    `- ${type}: ${count}个`
).join('\n')}

## 改进建议

${safeVars.recommendations.map((rec, index) => 
    `### ${index + 1}. ${rec.title} (${rec.priority})\n\n${rec.description}\n\n**影响**: ${rec.impact}\n`
).join('\n')}

## 风险识别

${safeVars.risks.map((risk, index) =>
    `### ${index + 1}. ${risk.title} (${risk.severity})\n\n${risk.description}\n\n**缓解方案**: ${risk.mitigation}\n`
).join('\n')}

## 附录

### 生成信息

- **分析时间**: ${safeVars.generated_at}
- **分析工具**: mg_kiro MCP Server v2.0.1
- **文档版本**: 1.0.0

### 配置示例
\`\`\`yaml
project:
  name: "${safeVars.project_name}"
  language: "${safeVars.primary_language}"
  
analysis:
  modules: ${safeVars.total_modules}
  relations: ${safeVars.total_relations}
\`\`\`

---

*本文档由 mg_kiro MCP Server 自动生成，基于项目代码静态分析结果。*
`;
}

/**
 * 提取文档章节 (从contracts.js复制)
 */
function _extractSections(content) {
  const sections = [];
  const lines = content.split('\n');
  let currentSection = null;
  
  lines.forEach(line => {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const title = headerMatch[2];
      
      if (level <= 2) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        currentSection = {
          title,
          level,
          content: []
        };
      }
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  });
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections.map(section => ({
    title: section.title,
    level: section.level,
    content: section.content.join('\n').trim()
  }));
}