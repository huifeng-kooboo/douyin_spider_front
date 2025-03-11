# 抖音用户批量比对工具

这是一个用于批量比对抖音用户视频内容的前端应用。

## 功能特点

- 支持多个抖音用户ID的批量输入（每行一个或使用逗号分隔）
- 显示比对进度和结果
- 支持下载用户链接
- 响应式设计，适配各种屏幕尺寸

## 技术栈

- Vue 3 
- Element Plus
- Axios
- Vite

## 开发环境设置

1. 克隆项目
```
git clone <仓库地址>
cd douyin_spider
```

2. 安装依赖
```
npm install
```

3. 启动开发服务器
```
npm run dev
```

4. 打开浏览器访问 `http://localhost:5173`

## 生产环境构建

```
npm run build
```

构建完成后，生成的静态文件将位于 `dist` 目录中，可以部署到任何静态文件服务器上。

## 后端API

本项目需要配合后端API使用。默认的API地址是 `http://localhost:3000/api`，可以通过环境变量进行配置。

主要API端点：
- `/douyin/compare` - 批量比对用户视频
- `/douyin/user/:userId` - 获取用户信息
- `/douyin/user/:userId/videos` - 获取用户视频列表
- `/douyin/download-links` - 下载用户链接

## 许可证

MIT
