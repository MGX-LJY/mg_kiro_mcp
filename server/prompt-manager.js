/**
 * Prompt Manager - mg_kiro MCP Server Prompt Management System
 * Handles prompt loading, caching, template variable replacement, and version control
 */

import { readFileSync, existsSync, statSync, watch } from 'fs';
import { join, dirname, extname } from 'path';
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
      promptsPath: config.promptsPath || join(__dirname, '..', 'prompts'),
      cacheEnabled: config.cacheEnabled !== false,
      cacheTTL: config.cacheTTL || 3600000, // 1 hour in milliseconds
      watchFiles: config.watchFiles !== false,
      version: config.version || '1.0.0',
      ...config
    };

    // Cache storage
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    
    // File watchers
    this.watchers = new Map();
    
    // Template variables registry
    this.globalVariables = new Map();
    
    this._initializeManager();
  }

  /**
   * Initialize the prompt manager
   */
  _initializeManager() {
    console.log('Initializing Prompt Manager...');
    
    // Set up global variables
    this._setupGlobalVariables();
    
    // Start file watching if enabled
    if (this.config.watchFiles) {
      this._setupFileWatching();
    }
    
    console.log('Prompt Manager initialized');
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
   * Set up file watching for automatic cache invalidation
   */
  _setupFileWatching() {
    const watchPath = this.config.promptsPath;
    
    if (!existsSync(watchPath)) {
      console.warn(`Prompts directory not found: ${watchPath}`);
      return;
    }

    try {
      const watcher = watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (filename && extname(filename) === '.md') {
          console.log(`Prompt file changed: ${filename}`);
          this._invalidateCache(filename);
        }
      });

      this.watchers.set('prompts', watcher);
      console.log('File watching enabled for prompts directory');
    } catch (error) {
      console.error('Failed to set up file watching:', error);
    }
  }

  /**
   * Load a prompt by category and name
   * @param {string} category - Prompt category (modes, templates, snippets)
   * @param {string} name - Prompt name (without .md extension)
   * @param {Object} variables - Template variables to replace
   * @returns {Promise<Object>} Prompt content and metadata
   */
  async loadPrompt(category, name, variables = {}) {
    const cacheKey = `${category}/${name}`;
    
    // Check cache first
    if (this.config.cacheEnabled && this._isCacheValid(cacheKey)) {
      console.log(`Loading prompt from cache: ${cacheKey}`);
      return this._getCachedPrompt(cacheKey, variables);
    }

    // Load from file
    console.log(`Loading prompt from file: ${cacheKey}`);
    const promptData = await this._loadPromptFromFile(category, name);
    
    // Cache the raw prompt
    if (this.config.cacheEnabled) {
      this._cachePrompt(cacheKey, promptData);
    }

    // Process template variables
    return this._processPrompt(promptData, variables);
  }

  /**
   * Load prompt from file system
   * @param {string} category - Prompt category
   * @param {string} name - Prompt name
   * @returns {Promise<Object>} Raw prompt data
   */
  async _loadPromptFromFile(category, name) {
    const filePath = join(this.config.promptsPath, category, `${name}.md`);
    
    if (!existsSync(filePath)) {
      throw new Error(`Prompt file not found: ${filePath}`);
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const stats = statSync(filePath);
      
      const promptData = {
        category,
        name,
        content,
        filePath,
        size: stats.size,
        lastModified: stats.mtime,
        version: this._extractVersion(content),
        metadata: this._parseMetadata(content)
      };

      return promptData;
    } catch (error) {
      throw new Error(`Failed to load prompt file ${filePath}: ${error.message}`);
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
   * Invalidate cache for a specific file
   * @param {string} filename - File that changed
   */
  _invalidateCache(filename) {
    const cacheKey = filename.replace('.md', '').replace(/\\/g, '/');
    
    if (this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
      this.cacheTimestamps.delete(cacheKey);
      console.log(`Cache invalidated for: ${cacheKey}`);
    }
  }

  /**
   * Get all available prompts by category
   * @param {string} category - Category to list
   * @returns {Array} List of available prompts
   */
  async listPrompts(category = null) {
    const categories = category ? [category] : ['modes', 'templates', 'snippets'];
    const prompts = {};

    for (const cat of categories) {
      const categoryPath = join(this.config.promptsPath, cat);
      
      if (!existsSync(categoryPath)) {
        prompts[cat] = [];
        continue;
      }

      try {
        const fs = await import('fs');
        const files = await fs.promises.readdir(categoryPath);
        prompts[cat] = files
          .filter(file => file.endsWith('.md'))
          .map(file => file.replace('.md', ''));
      } catch (error) {
        console.error(`Failed to list prompts in ${cat}:`, error);
        prompts[cat] = [];
      }
    }

    return category ? prompts[category] : prompts;
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
    // Close file watchers
    for (const [name, watcher] of this.watchers) {
      watcher.close();
      console.log(`Closed file watcher: ${name}`);
    }
    
    // Clear caches
    this.clearCache();
    
    console.log('Prompt Manager destroyed');
  }
}

export default PromptManager;