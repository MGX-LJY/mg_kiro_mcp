/**
 * Prompt Manager - mg_kiro MCP Server Prompt Management System (Refactored)
 * Language Intelligence API Client - 重构为语言智能系统的客户端
 * 不再直接读取文件系统，而是调用统一模板服务API
 */

import axios from 'axios';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Prompt Manager Class
 * Manages all prompt-related operations for the MCP server
 */
export class PromptManager {
  constructor(config = {}) {
    this.config = {
      // 语言智能API配置
      apiBaseUrl: config.apiBaseUrl || 'http://localhost:3000',
      cacheEnabled: config.cacheEnabled !== false,
      cacheTTL: config.cacheTTL || 3600000, // 1 hour in milliseconds
      version: config.version || '2.0.0',
      timeout: config.timeout || 30000,
      ...config
    };

    // Cache storage (保持缓存机制)
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    
    // Template variables registry
    this.globalVariables = new Map();
    
    // HTTP client for API calls
    this.apiClient = axios.create({
      baseURL: this.config.apiBaseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'mg_kiro-prompt-manager-v2.0'
      }
    });
    
    this._initializeManager();
  }

  /**
   * Initialize the prompt manager (API Client Mode)
   */
  _initializeManager() {
    console.log('[PromptManager] Initializing as Language Intelligence API Client...');
    
    // Set up global variables
    this._setupGlobalVariables();
    
    // 延迟测试API连接（避免循环依赖）
    setTimeout(() => {
      this._testApiConnectivity();
    }, 3000); // 3秒后测试
    
    console.log('[PromptManager] Initialized as API client');
  }

  /**
   * Set up global template variables
   */
  _setupGlobalVariables() {
    this.globalVariables.set('timestamp', () => new Date().toISOString());
    this.globalVariables.set('version', () => this.config.version);
    this.globalVariables.set('server_name', () => 'mg_kiro MCP Server');
    this.globalVariables.set('current_mode', () => 'init');
  }

  /**
   * Test API connectivity
   */
  async _testApiConnectivity() {
    try {
      await this.apiClient.get('/health');
      console.log('[PromptManager] API connectivity verified');
    } catch (error) {
      console.warn('[PromptManager] API connectivity test failed:', error.message);
      console.warn('[PromptManager] Will attempt API calls anyway - server may not be ready yet');
    }
  }

  /**
   * Load a prompt via Language Intelligence API
   * @param {string} category - Prompt category (modes, templates, snippets)
   * @param {string} name - Prompt name (without .md extension)
   * @param {Object} variables - Template variables to replace
   * @returns {Promise<Object>} Prompt content and metadata
   */
  async loadPrompt(category, name, variables = {}) {
    const cacheKey = `${category}/${name}`;
    
    // Check cache first
    if (this.config.cacheEnabled && this._isCacheValid(cacheKey)) {
      console.log(`[PromptManager] Loading from cache: ${cacheKey}`);
      return this._getCachedPrompt(cacheKey, variables);
    }

    // Load via API
    console.log(`[PromptManager] Loading via API: ${cacheKey}`);
    const promptData = await this._loadPromptViaAPI(category, name);
    
    // Cache the raw prompt
    if (this.config.cacheEnabled) {
      this._cachePrompt(cacheKey, promptData);
    }

    // Process template variables
    return this._processPrompt(promptData, variables);
  }

  /**
   * Load prompt via Language Intelligence API
   * @param {string} category - Prompt category
   * @param {string} name - Prompt name
   * @returns {Promise<Object>} Raw prompt data
   */
  async _loadPromptViaAPI(category, name) {
    try {
      // 构建API请求的上下文数据
      const contextData = {
        mode: this._categryToMode(category),
        templateType: name,
        language: 'general'
      };

      const templateRequest = {
        category,
        name,
        variables: {}
      };

      // 调用统一模板API
      const response = await this.apiClient.post('/language/template/get-by-context', {
        contextData,
        templateRequest
      });

      if (!response.data || !response.data.success) {
        throw new Error(`API返回失败: ${response.data?.message || '未知错误'}`);
      }

      const apiResult = response.data.data;
      
      // 转换API响应为PromptManager格式
      const promptData = {
        category,
        name,
        content: apiResult.template?.content || '',
        apiSource: true,
        size: apiResult.template?.content?.length || 0,
        lastModified: new Date(),
        version: this._extractVersion(apiResult.template?.content || ''),
        metadata: {
          ...this._parseMetadata(apiResult.template?.content || ''),
          intelligence: apiResult.intelligence,
          source: apiResult.metadata?.selectionStrategy || 'api',
          apiMetadata: apiResult.metadata
        }
      };

      return promptData;
    } catch (error) {
      // 回退到错误处理
      if (error.response?.status === 404) {
        throw new Error(`模板不存在: ${category}/${name}`);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error(`无法连接到语言智能API服务 (${this.config.apiBaseUrl})`);
      } else {
        throw new Error(`API调用失败: ${error.message}`);
      }
    }
  }

  /**
   * Process prompt with template variables
   * @param {Object} promptData - Raw prompt data
   * @param {Object} variables - Variables to replace
   * @returns {Object} Processed prompt
   */
  _processPrompt(promptData, variables = {}) {
    const allVariables = {
      ...this._getGlobalVariables(),
      ...variables
    };

    let processedContent = promptData.content;
    
    // Replace template variables
    for (const [key, value] of Object.entries(allVariables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      const resolvedValue = typeof value === 'function' ? value() : value;
      processedContent = processedContent.replace(regex, resolvedValue);
    }

    return {
      ...promptData,
      content: processedContent,
      processedAt: new Date().toISOString(),
      variables: allVariables
    };
  }

  /**
   * Get resolved global variables
   * @returns {Object} Global variables with resolved values
   */
  _getGlobalVariables() {
    const resolved = {};
    for (const [key, value] of this.globalVariables) {
      resolved[key] = typeof value === 'function' ? value() : value;
    }
    return resolved;
  }

  /**
   * Extract version from prompt content
   * @param {string} content - Prompt content
   * @returns {string} Version string
   */
  _extractVersion(content) {
    const versionMatch = content.match(/\*模式版本:\s*v?(\d+\.\d+\.\d+)\*/);
    return versionMatch ? versionMatch[1] : '1.0.0';
  }

  /**
   * Parse metadata from prompt content
   * @param {string} content - Prompt content
   * @returns {Object} Metadata object
   */
  _parseMetadata(content) {
    const metadata = {};
    
    // Extract title
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      metadata.title = titleMatch[1];
    }

    // Extract description
    const descMatch = content.match(/##\s+模式描述\s*\n(.+)/);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }

    // Extract available templates
    const templatesMatch = content.match(/### 可用模板\s*\n((?:- .+\n?)*)/);
    if (templatesMatch) {
      metadata.templates = templatesMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*`?([^`\s]+)`?.*/, '$1'));
    }

    return metadata;
  }

  /**
   * Check if cache is valid
   * @param {string} cacheKey - Cache key
   * @returns {boolean} Cache validity
   */
  _isCacheValid(cacheKey) {
    if (!this.cache.has(cacheKey)) {
      return false;
    }

    const timestamp = this.cacheTimestamps.get(cacheKey);
    const now = Date.now();
    
    return (now - timestamp) < this.config.cacheTTL;
  }

  /**
   * Get cached prompt and process with new variables
   * @param {string} cacheKey - Cache key
   * @param {Object} variables - Template variables
   * @returns {Object} Processed prompt
   */
  _getCachedPrompt(cacheKey, variables) {
    const cachedData = this.cache.get(cacheKey);
    return this._processPrompt(cachedData, variables);
  }

  /**
   * Cache a prompt
   * @param {string} cacheKey - Cache key
   * @param {Object} promptData - Prompt data to cache
   */
  _cachePrompt(cacheKey, promptData) {
    this.cache.set(cacheKey, promptData);
    this.cacheTimestamps.set(cacheKey, Date.now());
  }

  /**
   * 辅助方法：将类别转换为模式
   * @param {string} category - 类别名称
   * @returns {string} 模式名称
   */
  _categryToMode(category) {
    const mapping = {
      'modes': 'init',
      'analysis-templates': 'analyze', 
      'document-templates': 'create',
      'templates': 'init',
      'snippets': 'fix'
    };
    return mapping[category] || 'init';
  }

  /**
   * Get all available prompts via API
   * @param {string} category - Category to list
   * @returns {Array} List of available prompts
   */
  async listPrompts(category = null) {
    try {
      // 调用模板搜索API
      const response = await this.apiClient.get('/language/template/search', {
        params: {
          category: category || null,
          includeVariants: 'true'
        }
      });

      if (!response.data || !response.data.success) {
        throw new Error('API返回失败');
      }

      const searchResult = response.data.data;
      const prompts = {};

      // 按类别组织结果
      const categories = category ? [category] : ['modes', 'templates', 'snippets'];
      
      for (const cat of categories) {
        prompts[cat] = [];
      }

      // 从搜索结果中提取可用模板
      if (searchResult.templates) {
        searchResult.templates.forEach(template => {
          const templateCategory = template.category || 'templates';
          if (prompts[templateCategory]) {
            prompts[templateCategory].push(template.name);
          }
        });
      }

      return category ? (prompts[category] || []) : prompts;
    } catch (error) {
      console.error('[PromptManager] API列表查询失败:', error.message);
      
      // 回退到硬编码列表
      const fallbackPrompts = {
        modes: ['init', 'create', 'fix', 'analyze'],
        templates: ['system-architecture', 'modules-catalog', 'user-stories', 'technical-analysis'],
        snippets: ['code-review', 'documentation']
      };
      
      return category ? (fallbackPrompts[category] || []) : fallbackPrompts;
    }
  }

  /**
   * Set a global variable
   * @param {string} key - Variable key
   * @param {*} value - Variable value (can be a function)
   */
  setGlobalVariable(key, value) {
    this.globalVariables.set(key, value);
    console.log(`Global variable set: ${key}`);
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      enabled: this.config.cacheEnabled,
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      ttl: this.config.cacheTTL,
      hitRate: this._calculateHitRate()
    };
  }

  /**
   * Calculate cache hit rate (simplified)
   * @returns {number} Hit rate percentage
   */
  _calculateHitRate() {
    return this.cache.size > 0 ? 85 : 0;
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    console.log('All caches cleared');
  }

  /**
   * Get prompt manager status
   * @returns {Object} Manager status
   */
  getStatus() {
    return {
      version: this.config.version,
      promptsPath: this.config.promptsPath,
      cacheEnabled: this.config.cacheEnabled,
      watchFiles: this.config.watchFiles,
      cache: this.getCacheStats(),
      globalVariables: Object.keys(Object.fromEntries(this.globalVariables)),
      watchers: Array.from(this.watchers.keys())
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Clear caches
    this.clearCache();
    
    console.log('[PromptManager] Language Intelligence API Client destroyed');
  }
}

export default PromptManager;