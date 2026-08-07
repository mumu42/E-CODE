---
description: 工具函数、类、业务逻辑的注释规范
globs: **/*.ts,**/*.tsx
alwaysApply: true
---

# 代码注释规范

## 1. 工具类函数/类注释规范

### 1.1 文件头注释（必须）

**重要：工具类函数要有文件头，以及注释，否则不做合并处理**

```typescript
/**
 * @file utils/ros.ts
 * @description ROS通信相关的工具函数
 * @author xxx
 * @date 2024-04-22
 */
```

### 1.2 函数注释（JSDoc 风格，必须）

使用 JSDoc 格式注释函数，说明参数、返回值、使用示例：

```typescript
/**
 * 向 ROS action 服务发送目标
 * @param rosConnect ROS 链接对象
 * @param actionName action 名称
 * @param actionType action 类型
 * @param param 发送参数
 * @param onSuccess 成功回调
 * @param onFeedback 反馈回调
 * @param onFailback 失败回调
 * @param addLog 是否记录日志，默认 true
 * @returns goalId 任务ID
 */
export function sendActionGoal(
  rosConnect: RosConnect,
  actionName: string,
  actionType: string,
  param: any,
  onSuccess?: (result: any) => void,
  onFeedback?: (feedback: any) => void,
  onFailback?: (error: any) => void,
  addLog: boolean = true
): string {
  // 实现
}
```

### 1.3 类注释与使用说明（重点，必须！）

类注释必须包含：
1. 类的功能描述
2. 典型用法示例（代码块）
3. 构造函数参数说明
4. 主要方法说明

```typescript
/**
 * DataChannelManager
 *
 * 用于管理 WebRTC PeerConnection 与 DataChannel，支持点对点数据/文件通信及信令交互。
 *
 * ### 典型用法
 * ```typescript
 * const manager = new DataChannelManager("wss://server.com", "room-001");
 * manager.onMessage(msg => {
 *   console.log('收到消息:', msg);
 * });
 * manager.createOffer();
 *
 * // 关闭连接
 * manager.close();
 * ```
 *
 * @class
 * @param signalingServerUrl 信令服务器URL
 * @param roomId 房间ID
 * @param iceServers 可选，ICE服务器列表
 * @param serverId 信令服务器ID
 */
class DataChannelManager {
  constructor(
    signalingServerUrl: string,
    roomId: string,
    iceServers?: RTCIceServer[],
    serverId?: string
  ) {
    // 实现
  }

  /**
   * 监听收到的消息
   * @param callback 消息回调函数
   */
  onMessage(callback: (message: any) => void): void {
    // 实现
  }

  /**
   * 创建 Offer
   * @returns Promise<void>
   */
  async createOffer(): Promise<void> {
    // 实现
  }

  /**
   * 关闭连接并清理资源
   */
  close(): void {
    // 实现
  }
}

export default DataChannelManager;
```

**所有公开方法**需用 JSDoc 注释参数与用途。构造函数/方法的使用范例可放在类注释或 README。

## 2. React 组件注释

### 2.1 组件头部注释

对于复杂组件或带权限控制的组件，添加功能说明和使用示例：

```typescript
/**
 * 带权限控制的 Button 组件
 * 自动获取当前路径，无需手动传入完整路径
 *
 * @example
 * ```tsx
 * <AccessButton accessCode="add" type="primary">
 *   添加
 * </AccessButton>
 * ```
 */
export const AccessButton: React.FC<IAccessButtonProps> = ({
  accessCode,
  children,
  ...props
}) => {
  // 实现
};
```

### 2.2 Props 类型注释

复杂的 Props 类型添加注释说明：

```typescript
interface IAccessButtonProps extends ButtonProps {
  /** 权限码，用于权限判断 */
  accessCode: string;
  /** 按钮内容 */
  children: React.ReactNode;
  /** 是否禁用权限检查，默认 false */
  skipPermissionCheck?: boolean;
}
```

## 3. API 请求注释

### 3.1 请求方法注释

```typescript
/**
 * Get 请求
 * @param url 请求地址
 * @param config 请求配置
 * @returns {DTO.data} 直接返回 response.data.data
 */
public get<ResData = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ResData> {
  return this.instance.get(url, config).then((res) => res.data.data);
}
```

### 3.2 API 服务注释

```typescript
/**
 * 获取样本数据列表
 * @param params 查询参数
 * @returns 样本数据列表
 */
export const getSampleData = (params: ISampleQuery) => {
  return request.get<ISampleResponse>('/api/sample/list', { params });
};
```

## 4. 业务逻辑注释

### 4.1 复杂业务逻辑

对于复杂的业务逻辑，添加注释说明：

```typescript
// ✅ 正确
// 处理整合本地路由和后端返回的路由
const newLists = [...localMenuRouters, ...payload];

// 过滤掉无权限的菜单项
const filteredMenus = menus.filter((menu) => {
  return permissions.includes(menu.code);
});
```

### 4.2 临时方案或 TODO

使用注释标记临时方案或待办事项：

```typescript
// TODO: 从后端获取 id
id: ''

// FIXME: 临时方案，后续需要优化
const tempData = JSON.parse(localStorage.getItem('data') || '{}');

// HACK: 绕过第三方库的 bug
// 详见 issue: https://github.com/xxx/xxx/issues/123
const workaround = () => {
  // ...
};
```

## 5. 类型定义注释

### 5.1 复杂类型注释

```typescript
/**
 * 用户信息
 */
interface IUser {
  /** 用户ID */
  id: number;
  /** 用户名 */
  name: string;
  /** 用户角色 */
  role: UserRole;
  /** 创建时间，Unix 时间戳（毫秒） */
  createdAt: number;
}

/**
 * API 响应数据结构
 */
type ResponseData<T> = {
  /** 状态码，0 表示成功 */
  code: number;
  /** 响应数据 */
  data: T;
  /** 响应消息 */
  message: string;
};
```

## 6. 工具函数与类的用法及规范

### 6.1 函数

- **只做单一功能**，易于测试与复用
- 暴露为 `export const fnName = ...` 或 `export function fnName(...)`
- 必须添加 JSDoc 注释

```typescript
/**
 * 格式化日期为 yyyy-MM-dd
 * @param date Date对象
 * @returns 格式化后的字符串
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### 6.2 类

- 封装多状态和多方法（如 WebRTC 管理器）
- 必须在类注释中给出：
  - 如何实例化
  - 如何监听事件
  - 如何关闭
- 必须有构造参数和典型用法注释

## 7. 公用工具函数与业务工具函数

### 7.1 公用工具函数（全局复用）

- 放在 `lib/utils/` 下
- 命名规范：`kebab-case`，如 `format-date.ts`、`request.ts`
- **只做无业务依赖的通用功能**
- **全局公用工具函数不得包含业务逻辑，否则不做合并处理**

```typescript
/**
 * @file utils/format-date.ts
 * @description 日期格式化工具函数
 * @author xxx
 * @date 2024-04-22
 */

/**
 * 格式化日期为 yyyy-MM-dd
 * @param date Date对象
 * @returns 格式化后的字符串
 */
export function formatDate(date: Date): string {
  // ...
}
```

### 7.2 业务模块工具函数

- 放在业务模块自己的 `utils/` 目录下，如 `app/topics/utils/`
- 命名规范同上
- 只服务于该业务模块，便于维护

```typescript

/**
 * 通用 eventFun 函数
 * @param sex 性别
 * @param name 名字
 * @returns 用户ID
 */
export const eventFun = (
  sex: RosConnect,
  name: string
): string => {
  // ...
};
```

### 7.3 调用建议

- **全局公用工具函数**只能依赖其他公用工具，不应依赖业务模块
- **业务模块工具函数**可以依赖公用工具，也可以依赖本模块状态和业务

## 8. 注释规范总结

- **分类清晰**：公用工具 vs 业务工具
- **注释标准**：文件头注释 + JSDoc + 典型用法
- **函数和类**：函数单一职责，类必须有示例和完整文档
- **目录清楚**：通用工具独立，业务工具归属模块
