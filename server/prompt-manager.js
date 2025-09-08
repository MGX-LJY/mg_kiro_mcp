/**
 * Prompt Manager - mg_kiro MCP Server Prompt Management System (Decoupled)
 * 解耦版本：移除HTTP API自调用，直接使用服务依赖
 */

import TemplateReader from './services/template-reader.js';

/**
 * Prompt Manager Class  
 * 无循环依赖的提示词管理器
 */
export class PromptManager {
  constructor(config = {}) {
    this.config = {
      cacheEnabled: config.cacheEnabled !== false,
      cacheTTL: config.cacheTTL || 3600000, // 1 hour in milliseconds
      version: config.version || '2.0.0',
      ...config
    };

    // Cache storage
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    
    // Template variables registry
    this.globalVariables = new Map();
    
    // 依赖注入 - 使用TemplateReader替代HTTP API调用
    this.templateReader = new TemplateReader();
    
    this._initializeManager();
  }

  /**
   * Initialize the prompt manager (Service-based Mode)
   */
  _initializeManager() {
    console.log('[PromptManager] Initializing with direct service dependencies...');
    
    // Set up global variables
    this._setupGlobalVariables();
    
    console.log('[PromptManager] Initialized without HTTP dependencies');
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
   * Load a prompt using direct service calls (no HTTP)
   * @param {string} category - Prompt category
   * @param {string} name - Prompt name  
   * @param {Object} variables - Template variables
   * @returns {Promise<Object>} Prompt content and metadata
   */
  async loadPrompt(category, name, variables = {}) {
    const cacheKey = `${category}/${name}`;
    
    // Check cache first
    if (this.config.cacheEnabled && this._isValidCache(cacheKey)) {
      return this._getCachedPrompt(cacheKey, variables);
    }

    try {
      // Direct service call instead of HTTP API
      const templateData = await this.templateReader.readTemplate(category, name);
      
      if (!templateData) {
        throw new Error(`Template not found: ${category}/${name}`);
      }

      // Process template with variables
      const processedContent = this._processPrompt(templateData.content, variables);
      
      const promptResult = {
        category,
        name,
        content: processedContent,
        rawContent: templateData.content,
        variables: variables,
        size: processedContent.length,
        lastModified: templateData.lastModified,
        cached: false,
        source: 'direct'
      };

      // Cache the result
      if (this.config.cacheEnabled) {
        this._cachePrompt(cacheKey, templateData.content, templateData.lastModified);
      }

      return promptResult;

    } catch (error) {
      console.error(`[PromptManager] Load prompt failed ${category}/${name}:`, error.message);
      throw error;
    }
  }

  /**
   * List prompts in a category
   */
  async listPrompts(category = null) {
    try {
      if (category) {
        const templates = await this.templateReader.listTemplates(category);
        return {
          prompts: templates.map(t => ({
            name: t.name,
            category: t.category,
            size: t.size
          })),
          category,
          total: templates.length
        };
      }

      // List all categories (重构后的新结构)
      const categories = ['modes', 'analysis', 'generation', 'snippets', 'languages'];
      const allPrompts = [];
      
      for (const cat of categories) {
        const templates = await this.templateReader.listTemplates(cat);
        allPrompts.push(...templates.map(t => ({
          name: t.name,
          category: t.category,
          size: t.size
        })));
      }

      return {
        prompts: allPrompts,
        total: allPrompts.length,
        categories: categories.length
      };

    } catch (error) {
      console.error('[PromptManager] List prompts failed:', error.message);
      throw error;
    }
  }

  /**
   * Process template content with variables
   * @private
   */
  _processPrompt(content, variables = {}) {
    if (!content || typeof content !== 'string') {
      return content;
    }

    let processed = content;
    
    // Merge global variables with provided variables
    const allVariables = new Map(this.globalVariables);
    Object.entries(variables).forEach(([key, value]) => {
      allVariables.set(key, value);
    });

    // Replace variables
    for (const [key, value] of allVariables) {
      const resolvedValue = typeof value === 'function' ? value() : value;
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processed = processed.replace(pattern, String(resolvedValue));
    }

    return processed;
  }

  /**
   * Check if cached data is valid
   * @private
   */
  _isValidCache(cacheKey) {
    if (!this.cache.has(cacheKey)) {
      return false;
    }

    const timestamp = this.cacheTimestamps.get(cacheKey);
    const now = Date.now();
    return (now - timestamp) < this.config.cacheTTL;
  }

  /**
   * Get cached prompt
   * @private
   */
  _getCachedPrompt(cacheKey, variables) {
    const cachedContent = this.cache.get(cacheKey);
    const processedContent = this._processPrompt(cachedContent, variables);
    
    const [category, name] = cacheKey.split('/');
    
    return {
      category,
      name,
      content: processedContent,
      rawContent: cachedContent,
      variables,
      size: processedContent.length,
      cached: true,
      source: 'cache'
    };
  }

  /**
   * Cache prompt data
   * @private
   */
  _cachePrompt(cacheKey, content, lastModified) {
    this.cache.set(cacheKey, content);
    this.cacheTimestamps.set(cacheKey, Date.now());
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    this.templateReader.clearCache();
    console.log('[PromptManager] Cache cleared');
  }

  /**
   * Get manager status
   */
  getStatus() {
    return {
      version: this.config.version,
      initialized: true,
      cacheEnabled: this.config.cacheEnabled,
      cacheSize: this.cache.size,
      globalVariables: Array.from(this.globalVariables.keys()),
      type: 'direct-service',
      dependencies: ['template-reader']
    };
  }

  /**
   * Set global variable
   */
  setGlobalVariable(key, value) {
    this.globalVariables.set(key, value);
  }

  /**
   * Remove global variable
   */
  removeGlobalVariable(key) {
    return this.globalVariables.delete(key);
  }
}

export default PromptManager;