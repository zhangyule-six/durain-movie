# 关注系统设计文档

## 概述

为 Durain Movie 平台实现用户关注功能。用户可在热门影评（Wander 页面）中关注评论作者，在个人中心查看关注/粉丝列表，并跳转到被关注者的主页。

## 需求决策

| 决策项 | 选择 |
|--------|------|
| 取消关注交互 | 二次确认弹窗（防误操作） |
| 用户中心入口 | Instagram 风格统计栏（关注 X / 粉丝 X） |
| 列表展示形式 | 右侧抽屉（NDrawer，360px） |
| 状态管理方式 | Composable 模式（非全局 Store） |

## 后端 API

利用已有的 `Follow` 模型（`follower`/`following` 引用 `User`）和 `User.stats` 预留字段。

### 路由设计

挂载在 `/api/users`，新增文件 `routes/follow.route.js`。

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/users/:userId/follow` | 关注用户 | `protectRoute` |
| DELETE | `/api/users/:userId/follow` | 取消关注 | `protectRoute` |
| GET | `/api/users/:userId/followers` | 粉丝列表（分页） | `optionalAuth` |
| GET | `/api/users/:userId/following` | 关注列表（分页） | `optionalAuth` |
| GET | `/api/users/:userId/is-following` | 当前用户是否已关注目标 | `protectRoute` |

### 关注逻辑

- **关注**：校验不能关注自己 → 查重 → 写入 `Follow` 文档 → `User.stats.following` 和 `User.stats.followers` 用 `$inc` 原子操作 +1 → 创建 `type: "follow"` 通知
- **取关**：删除 `Follow` 文档 → 两边计数 `$inc` -1
- **防护**：重复关注返回 409，关注不存在的用户返回 404

### 列表返回格式

```json
{
  "items": [
    { "_id": "userId", "username": "xxx", "avatar": "url", "bio": "..." }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### 文件变动

- 新增 `src/routes/follow.route.js`
- 新增 `src/controllers/follow.controller.js`
- 修改 `src/app.js`：注册 `/api/users` 路由

## 前端 API 层

### `api/follow.ts`

沿用项目 `useRequest` 模式：

```typescript
useFollowUser(userId)         // POST /api/users/:userId/follow
useUnfollowUser(userId)       // DELETE /api/users/:userId/follow
useCheckFollowing(userId)     // GET /api/users/:userId/is-following
useFollowingList(userId, page) // GET /api/users/:userId/following
useFollowersList(userId, page) // GET /api/users/:userId/followers
```

## Composable

### `composables/useFollow.ts`

```typescript
function useFollow(targetUserId: string) {
  isFollowing: Ref<boolean>
  loading: Ref<boolean>
  checkStatus(): Promise<void>   // mount 时调用
  follow(): Promise<void>
  unfollow(): Promise<void>
  toggle(): Promise<void>        // 根据 isFollowing 调用 follow/unfollow
}
```

每个组件实例独立管理状态，不做全局缓存。

## PopularReview 关注按钮

### 交互行为

1. **未登录**：点击 → `requireLogin()` 弹出登录弹窗
2. **已登录 + 未关注**：显示 `PlusCircle` → 点击关注 → 切换为 `CheckCircle2`
3. **已登录 + 已关注**：显示 `CheckCircle2` → 点击 → `useDialog` 确认弹窗 → 确认后取关 → 切回 `PlusCircle`
4. **自己的评论**：隐藏按钮（`author._id === currentUser._id`）
5. **loading**：按钮 disabled

### 视觉

- 未关注：`PlusCircle`，紫色 `#8a2be2`，tertiary 样式
- 已关注：`CheckCircle2`，同色实心填充

### 文件变动

- 修改 `frontend/src/views/Wander/component/PopularReview.vue`

## UserCenter 统计栏 + 抽屉

### 统计栏

在头像/用户名区域新增可点击的统计数字：

```
[头像]  用户名            关注 12  |  粉丝 8        [编辑资料]
        一句话简介
```

- 数据来源：`user.stats.following` / `user.stats.followers`
- 数字可点击，hover 时 underline
- 点击后打开对应类型的抽屉

### FollowDrawer 组件

新增 `views/UserCenter/FollowDrawer.vue`：

- Props：`type: 'following' | 'followers'`、`userId: string`、`visible: boolean`
- 使用 NaiveUI `NDrawer`，宽度 360px，从右侧滑出
- 列表项：头像 + 用户名 + bio（一行截断） + 关注/已关注按钮
- 点击头像或用户名 → `router.push('/user/:userId')`，关闭抽屉
- 关注列表中：右侧「已关注 ✓」可取关（带确认）
- 粉丝列表中：右侧显示「关注」/「已关注」（可回关或取关）
- 空状态文案：「还没有关注任何人」/「还没有粉丝」

### 文件变动

- 修改 `frontend/src/views/UserCenter/index.vue`
- 新增 `frontend/src/views/UserCenter/FollowDrawer.vue`

## 后续扩展（不在本次范围内）

- `UserProfile/index.vue`（他人主页）复用 `FollowDrawer`，展示统计栏
- 关注动态 feed
- 关注推荐
