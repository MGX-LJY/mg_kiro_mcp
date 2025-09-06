const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor(configDir = './config') {
    this.configDir = configDir;
    this.configs = {};
    this.watchers = new Map();
  }

  /**
   * 加载所有配置文件
   */
  async loadConfigs() {
    try {
      // 加载 MCP 配置
      this.configs.mcp = await this.loadConfig('mcp.config.json');
      
      // 加载模式配置  
      this.configs.modes = await this.loadConfig('modes.config.json');
      
      // 加载模板配置
      this.configs.templates = await this.loadConfig('templates.config.json');

      // 应用环境变量覆盖
      this.applyEnvironmentOverrides();

      console.log('✅ 配置加载完成');
      return this.configs;
    } catch (error) {
      console.error('❌ 配置加载失败:', error.message);
      throw error;
    }
  }

  /**
   * 加载单个配置文件
   */
  async loadConfig(filename) {
    const configPath = path.join(this.configDir, filename);
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`配置文件不存在: ${configPath}`);
    }

    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      throw new Error(`解析配置文件失败 ${filename}: ${error.message}`);
    }
  }

  /**
   * 应用环境变量覆盖
   */
  applyEnvironmentOverrides() {
    // MCP 服务器配置覆盖
    if (process.env.MCP_PORT) {
      this.configs.mcp.server.port = parseInt(process.env.MCP_PORT);
    }
    
    if (process.env.MCP_HOST) {
      this.configs.mcp.server.host = process.env.MCP_HOST;
    }

    if (process.env.MCP_LOG_LEVEL) {
      this.configs.mcp.logging.level = process.env.MCP_LOG_LEVEL;
    }

    // API 认证配置覆盖
    if (process.env.MCP_API_KEY) {
      this.configs.mcp.auth.enabled = true;
      this.configs.mcp.auth.api_key = process.env.MCP_API_KEY;
    }

    // 速率限制配置覆盖
    if (process.env.MCP_RATE_LIMIT) {
      this.configs.mcp.auth.rate_limit.max_requests = parseInt(process.env.MCP_RATE_LIMIT);
    }

    // 默认模式覆盖
    if (process.env.MCP_DEFAULT_MODE) {
      this.configs.modes.default_mode = process.env.MCP_DEFAULT_MODE;
    }

    // 功能开关覆盖
    if (process.env.MCP_HOT_RELOAD === 'false') {
      this.configs.mcp.features.hot_reload = false;
    }

    if (process.env.MCP_METRICS === 'false') {
      this.configs.mcp.features.metrics = false;
    }

    console.log('🔧 环境变量覆盖已应用');
  }

  /**
   * 获取配置值
   */
  get(configKey, defaultValue = null) {
    const keys = configKey.split('.');
    let value = this.configs;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * 设置配置值
   */
  set(configKey, value) {
    const keys = configKey.split('.');
    const lastKey = keys.pop();
    let target = this.configs;
    
    for (const key of keys) {
      if (!target[key]) {
        target[key] = {};
      }
      target = target[key];
    }
    
    target[lastKey] = value;
  }

  /**
   * 启用热重载
   */
  enableHotReload() {
    if (!this.get('mcp.features.hot_reload', false)) {
      return;
    }

    const configFiles = ['mcp.config.json', 'modes.config.json', 'templates.config.json'];
    
    configFiles.forEach(filename => {
      const configPath = path.join(this.configDir, filename);
      
      if (fs.existsSync(configPath)) {
        const watcher = fs.watch(configPath, (eventType) => {
          if (eventType === 'change') {
            console.log(`📁 检测到配置文件变化: ${filename}`);
            this.reloadConfig(filename);
          }
        });
        
        this.watchers.set(filename, watcher);
        console.log(`👁️  监听配置文件: ${filename}`);
      }
    });
  }

  /**
   * 重新加载单个配置文件
   */
  async reloadConfig(filename) {
    try {
      const configType = filename.split('.')[0]; // mcp, modes, templates
      const newConfig = await this.loadConfig(filename);
      this.configs[configType] = newConfig;
      
      // 重新应用环境变量覆盖
      this.applyEnvironmentOverrides();
      
      console.log(`✅ 配置文件重载完成: ${filename}`);
      
      // 触发配置变更事件
      this.emit('configChanged', { type: configType, config: newConfig });
    } catch (error) {
      console.error(`❌ 配置文件重载失败: ${filename}`, error.message);
    }
  }

  /**
   * 停止热重载
   */
  disableHotReload() {
    this.watchers.forEach((watcher, filename) => {
      watcher.close();
      console.log(`🔌 停止监听: ${filename}`);
    });
    this.watchers.clear();
  }

  /**
   * 验证配置
   */
  validate() {
    const errors = [];

    // 验证 MCP 配置
    if (!this.configs.mcp?.server?.port) {
      errors.push('MCP服务器端口未配置');
    }

    if (!this.configs.mcp?.mcp?.protocol_version) {
      errors.push('MCP协议版本未配置');
    }

    // 验证模式配置
    if (!this.configs.modes?.modes) {
      errors.push('工作模式未配置');
    } else {
      const modes = this.configs.modes.modes;
      const defaultMode = this.configs.modes.default_mode;
      
      if (defaultMode && !modes[defaultMode]) {
        errors.push(`默认模式 '${defaultMode}' 不存在`);
      }

      // 验证每个模式的必需字段
      Object.entries(modes).forEach(([modeId, mode]) => {
        if (!mode.name) {
          errors.push(`模式 '${modeId}' 缺少名称`);
        }
        if (!mode.prompt_path) {
          errors.push(`模式 '${modeId}' 缺少提示文件路径`);
        }
      });
    }

    // 验证模板配置
    if (!this.configs.templates?.templates) {
      errors.push('模板配置未配置');
    } else {
      const templates = this.configs.templates.templates;
      
      Object.entries(templates).forEach(([templateId, template]) => {
        if (!template.path) {
          errors.push(`模板 '${templateId}' 缺少文件路径`);
        }
        if (!fs.existsSync(template.path)) {
          errors.push(`模板文件不存在: ${template.path}`);
        }
      });
    }

    if (errors.length > 0) {
      throw new Error(`配置验证失败:\n${errors.map(e => `- ${e}`).join('\n')}`);
    }

    console.log('✅ 配置验证通过');
    return true;
  }

  /**
   * 获取模式配置
   */
  getMode(modeId) {
    return this.configs.modes?.modes?.[modeId] || null;
  }

  /**
   * 获取模板配置
   */
  getTemplate(templateId) {
    return this.configs.templates?.templates?.[templateId] || null;
  }

  /**
   * 获取所有启用的模式
   */
  getEnabledModes() {
    const modes = this.configs.modes?.modes || {};
    return Object.entries(modes)
      .filter(([, mode]) => mode.enabled !== false)
      .reduce((acc, [id, mode]) => {
        acc[id] = mode;
        return acc;
      }, {});
  }

  /**
   * 简单的事件发射器
   */
  emit(event, data) {
    // 简化的事件处理，实际项目中可使用 EventEmitter
    console.log(`🔔 事件触发: ${event}`, data);
  }
}

module.exports = ConfigManager;