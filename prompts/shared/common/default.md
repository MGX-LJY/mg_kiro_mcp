# 通用默认模板

## 📋 任务说明
这是mg_kiro MCP Server的通用模板，当没有找到更具体的模板时使用。

## 🎯 使用场景
- 作为其他模板的回退选项
- 通用的指导和帮助信息
- 模板系统测试和验证

## 📊 基本信息
- **生成时间**: {{timestamp}}
- **服务版本**: {{version}}
- **模板类型**: 通用默认模板
- **请求模式**: {{mode}}
- **请求步骤**: {{step}}

## 💡 通用指导原则

### 代码开发原则
1. **简洁优于复杂**: 代码应该易读易懂
2. **明确优于隐晦**: 不要猜测，要明确
3. **实用优于完美**: 先解决问题，再优化
4. **错误不应被忽略**: 明确处理异常
5. **可测试性**: 所有代码都应该易于测试

### 项目管理原则
1. **需求先行**: 明确需求后再开始编码
2. **文档同步**: 代码和文档保持同步更新
3. **测试驱动**: 编写测试用例验证功能
4. **持续改进**: 定期回顾和优化

### 质量保证原则
1. **代码审查**: 所有代码都应该经过审查
2. **自动化测试**: 建立完善的测试体系
3. **持续集成**: 自动化构建和部署
4. **监控告警**: 建立系统监控和告警

## 🔧 常用工具和命令

### Git操作
```bash
# 基本操作
git status                 # 查看状态
git add .                  # 添加所有文件
git commit -m "message"    # 提交更改
git push origin main       # 推送到远程

# 分支操作
git checkout -b new-branch # 创建并切换分支
git merge feature-branch   # 合并分支
git branch -d old-branch   # 删除分支
```

### 常用开发命令
```bash
# Node.js项目
npm install               # 安装依赖
npm start                # 启动项目
npm test                 # 运行测试
npm run build           # 构建项目

# Python项目
pip install -r requirements.txt  # 安装依赖
python main.py                   # 运行主程序
pytest                           # 运行测试
python -m build                  # 构建项目
```

## 📚 推荐资源

### 学习资源
- [MDN Web Docs](https://developer.mozilla.org/)
- [Python官方文档](https://docs.python.org/)
- [Git官方教程](https://git-scm.com/docs)
- [Docker官方文档](https://docs.docker.com/)

### 工具推荐
- **编辑器**: VS Code, IntelliJ IDEA
- **版本控制**: Git + GitHub/GitLab
- **容器化**: Docker + Docker Compose
- **CI/CD**: GitHub Actions, Jenkins

## 🎯 后续步骤建议

1. **明确需求**: 确定具体的开发需求和目标
2. **选择合适的模板**: 根据需求选择更具体的模板
3. **制定计划**: 制定详细的开发和实施计划
4. **开始实施**: 按计划逐步实施功能开发
5. **测试验证**: 完成开发后进行全面测试
6. **部署上线**: 部署到生产环境并监控运行

## 📞 获取帮助

如果您需要更具体的帮助：

1. **查看具体模板**: 根据您的模式（init/create/fix/analyze）查看对应的专用模板
2. **查阅文档**: 参考项目文档和API说明
3. **社区支持**: 在相关社区或论坛寻求帮助
4. **专业咨询**: 如需要，寻求专业技术咨询

---
*模板版本*: v4.0  
*模板类型*: 共享通用模板  
*适用场景*: 通用回退、帮助指导  
*生成时间*: {{timestamp}}  
*服务名称*: {{service_name}}