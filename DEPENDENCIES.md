# 📦 VS Code代码可视化扩展 - 依赖包说明

## 🌟 核心依赖

### 生产依赖
```json
{
  "ws": "^8.14.2",                    // WebSocket实时协作
  "node-fetch": "^3.3.2",            // HTTP请求 (用于AI API调用)
  "diff": "^5.1.0",                  // 代码差异比较
  "lodash": "^4.17.21",              // 工具函数库
  "crypto": "^1.0.1",                // 加密/哈希功能
  "uuid": "^9.0.1"                   // 唯一标识符生成
}
```

### 开発依赖
```json
{
  "@types/ws": "^8.5.8",             // WebSocket类型定义
  "@types/node-fetch": "^2.6.6",     // node-fetch类型定义
  "@types/diff": "^5.0.7",           // diff类型定义
  "@types/lodash": "^4.14.200",      // lodash类型定义
  "@types/uuid": "^9.0.6"            // uuid类型定义
}
```

## 🚀 安装命令

### 生产环境依赖
```bash
npm install ws node-fetch diff lodash uuid
```

### 开発环境依赖
```bash
npm install -D @types/ws @types/node-fetch @types/diff @types/lodash @types/uuid
```

### 一键安装所有依赖
```bash
npm install ws node-fetch diff lodash uuid @types/ws @types/node-fetch @types/diff @types/lodash @types/uuid
```

## 📋 功能映射

| 依赖包 | 用途 | 相关功能模块 |
|-------|------|------------|
| ws | WebSocket服务器/客户端 | realTimeCollaborationSystemEnhanced.ts |
| node-fetch | HTTP/HTTPS请求 | aiEnhancedAnalysisSystem.ts (AI API调用) |
| diff | 文本差异算法 | realTimeCodeSyncEngine.ts |
| lodash | 工具函数 | 全局工具方法、数据处理 |
| uuid | 唯一ID生成 | 会话管理、文件追踪 |

## ⚡ 使用说明

### WebSocket协作
- 用于多人实时代码分析协作
- 支持状态同步和冲突解决
- 需要ws包提供WebSocket功能

### AI增强分析
- 支持OpenAI GPT-4和Anthropic Claude
- 使用node-fetch进行API调用
- 提供智能代码解释和优化建议

### 实时代码同步
- 使用diff包进行代码变更检测
- 支持增量更新和冲突合并
- 提供可视化差异展示

## 🔧 配置建议

### VS Code设置 (settings.json)
```json
{
  "visualProgramming.ai.provider": "local",
  "visualProgramming.ai.temperature": 0.3,
  "visualProgramming.ai.maxTokens": 2000,
  "visualProgramming.collaboration.enabled": true,
  "visualProgramming.collaboration.port": 3001,
  "visualProgramming.sync.autoUpdate": true,
  "visualProgramming.sync.conflictResolution": "prompt"
}
```

### 环境变量
```env
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_claude_key_here
```

## 🛠️ 故障排除

### 常见问题
1. **WebSocket连接失败**: 检查防火墙设置和端口占用
2. **AI API调用失败**: 验证API密钥和网络连接
3. **类型错误**: 确保安装了对应的@types包

### 调试建议
1. 查看输出面板中的日志信息
2. 检查VS Code开发者工具的控制台
3. 验证依赖包版本兼容性
