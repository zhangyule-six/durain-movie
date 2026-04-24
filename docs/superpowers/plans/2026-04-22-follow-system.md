# 关注系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现用户关注功能，包括后端 API、前端 composable、PopularReview 关注按钮、UserCenter 统计栏与关注/粉丝抽屉。

**Architecture:** 后端利用已有的 Follow 模型和 User.stats 字段，新增 RESTful API。前端通过 composable 模式封装关注逻辑，各组件独立管理状态。UI 使用 NaiveUI 组件库。

**Tech Stack:** Express + MongoDB/Mongoose（后端）, Vue 3 + Pinia + NaiveUI + Tailwind（前端）

---

## 文件总览

| 操作 | 文件路径 | 职责 |
|------|----------|------|
| 新增 | `backend/src/controllers/follow.controller.js` | 关注/取关/列表/查询状态 |
| 新增 | `backend/src/routes/follow.route.js` | `/api/users/:userId/follow` 等路由 |
| 修改 | `backend/src/app.js` | 注册 follow 路由 |
| 新增 | `frontend/src/api/follow.ts` | 前端 API 封装 |
| 新增 | `frontend/src/composables/useFollow.ts` | 关注业务逻辑 composable |
| 修改 | `frontend/src/views/Wander/component/PopularReview.vue` | 关注按钮交互 |
| 新增 | `frontend/src/views/UserCenter/FollowDrawer.vue` | 关注/粉丝抽屉组件 |
| 修改 | `frontend/src/views/UserCenter/index.vue` | 统计栏 + 抽屉集成 |

---

### Task 1: 后端 Follow Controller

**Files:**
- Create: `backend/src/controllers/follow.controller.js`

- [ ] **Step 1: 创建 follow controller 文件，实现 followUser**

```javascript
import Follow from "../models/follow.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    if (followerId.toString() === userId) {
      return res.status(400).json({ message: "不能关注自己" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const existing = await Follow.findOne({ follower: followerId, following: userId });
    if (existing) {
      return res.status(409).json({ message: "已关注该用户" });
    }

    await Follow.create({ follower: followerId, following: userId });

    await Promise.all([
      User.findByIdAndUpdate(followerId, { $inc: { "stats.following": 1 } }),
      User.findByIdAndUpdate(userId, { $inc: { "stats.followers": 1 } }),
    ]);

    await Notification.create({
      receiver: userId,
      sender: followerId,
      type: "follow",
      refId: followerId,
      refType: "user",
    });

    res.status(201).json({ message: "关注成功" });
  } catch (err) {
    console.error("Error in followUser:", err);
    res.status(500).json({ message: "关注失败" });
  }
};
```

- [ ] **Step 2: 实现 unfollowUser**

在同一文件中追加：

```javascript
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const follow = await Follow.findOneAndDelete({ follower: followerId, following: userId });
    if (!follow) {
      return res.status(404).json({ message: "未关注该用户" });
    }

    await Promise.all([
      User.findByIdAndUpdate(followerId, { $inc: { "stats.following": -1 } }),
      User.findByIdAndUpdate(userId, { $inc: { "stats.followers": -1 } }),
    ]);

    res.status(200).json({ message: "已取消关注" });
  } catch (err) {
    console.error("Error in unfollowUser:", err);
    res.status(500).json({ message: "取消关注失败" });
  }
};
```

- [ ] **Step 3: 实现 getFollowers 和 getFollowing**

在同一文件中追加：

```javascript
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Follow.find({ following: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("follower", "username avatar bio"),
      Follow.countDocuments({ following: userId }),
    ]);

    res.json({
      items: items.map((f) => f.follower),
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("Error in getFollowers:", err);
    res.status(500).json({ message: "获取粉丝列表失败" });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Follow.find({ follower: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("following", "username avatar bio"),
      Follow.countDocuments({ follower: userId }),
    ]);

    res.json({
      items: items.map((f) => f.following),
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("Error in getFollowing:", err);
    res.status(500).json({ message: "获取关注列表失败" });
  }
};
```

- [ ] **Step 4: 实现 checkFollowing**

在同一文件中追加：

```javascript
export const checkFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const existing = await Follow.findOne({ follower: followerId, following: userId });
    res.json({ isFollowing: !!existing });
  } catch (err) {
    console.error("Error in checkFollowing:", err);
    res.status(500).json({ message: "查询关注状态失败" });
  }
};
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/follow.controller.js
git commit -m "feat: add follow controller with follow/unfollow/list/check APIs"
```

---

### Task 2: 后端 Follow 路由 + 注册

**Files:**
- Create: `backend/src/routes/follow.route.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: 创建 follow 路由文件**

```javascript
import express from "express";
import { protectRoute, optionalAuth } from "../middleware/auth.middleware.js";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowing,
} from "../controllers/follow.controller.js";

const router = express.Router();

router.post("/:userId/follow", protectRoute, followUser);
router.delete("/:userId/follow", protectRoute, unfollowUser);
router.get("/:userId/followers", optionalAuth, getFollowers);
router.get("/:userId/following", optionalAuth, getFollowing);
router.get("/:userId/is-following", protectRoute, checkFollowing);

export default router;
```

- [ ] **Step 2: 在 app.js 中注册路由**

在 `backend/src/app.js` 中添加 import 和注册：

import 行（在现有 import 之后追加）：
```javascript
import followRoutes from "./routes/follow.route.js";
```

注册行（在 `app.use("/api/ai", aiRoutes);` 之后追加）：
```javascript
app.use("/api/users", followRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/follow.route.js backend/src/app.js
git commit -m "feat: register follow routes at /api/users"
```

---

### Task 3: 前端 API 封装

**Files:**
- Create: `frontend/src/api/follow.ts`

- [ ] **Step 1: 创建 follow API 模块**

沿用项目 `useRequest` 模式（参考 `api/user.ts`）：

```typescript
import { useRequest } from './http'

export interface FollowUserInfo {
  _id: string
  username: string
  avatar?: string
  bio?: string
}

export interface FollowListResponse {
  items: FollowUserInfo[]
  total: number
  page: number
  limit: number
}

export interface CheckFollowingResponse {
  isFollowing: boolean
}

export function useFollowUser(userId: string) {
  return useRequest<{ message: string }>({
    url: `/api/users/${userId}/follow`,
    method: 'POST',
  })
}

export function useUnfollowUser(userId: string) {
  return useRequest<{ message: string }>({
    url: `/api/users/${userId}/follow`,
    method: 'DELETE',
  })
}

export function useCheckFollowing(userId: string) {
  return useRequest<CheckFollowingResponse>({
    url: `/api/users/${userId}/is-following`,
    method: 'GET',
  })
}

export function useFollowingList(userId: string, params?: { page?: number; limit?: number }) {
  return useRequest<FollowListResponse, { page?: number; limit?: number }>({
    url: `/api/users/${userId}/following`,
    method: 'GET',
    body: params ?? { page: 1, limit: 20 },
  })
}

export function useFollowersList(userId: string, params?: { page?: number; limit?: number }) {
  return useRequest<FollowListResponse, { page?: number; limit?: number }>({
    url: `/api/users/${userId}/followers`,
    method: 'GET',
    body: params ?? { page: 1, limit: 20 },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/follow.ts
git commit -m "feat: add follow API module"
```

---

### Task 4: 前端 useFollow Composable

**Files:**
- Create: `frontend/src/composables/useFollow.ts`

- [ ] **Step 1: 创建 useFollow composable**

```typescript
import { ref } from 'vue'
import { useFollowUser, useUnfollowUser, useCheckFollowing } from '@/api/follow'

export function useFollow(targetUserId: string) {
  const isFollowing = ref(false)
  const loading = ref(false)

  async function checkStatus() {
    if (!targetUserId) return
    try {
      const { execute } = useCheckFollowing(targetUserId)
      const result = await execute()
      isFollowing.value = result.isFollowing
    } catch {
      /* silent */
    }
  }

  async function follow() {
    if (loading.value) return
    loading.value = true
    try {
      const { execute } = useFollowUser(targetUserId)
      await execute()
      isFollowing.value = true
    } finally {
      loading.value = false
    }
  }

  async function unfollow() {
    if (loading.value) return
    loading.value = true
    try {
      const { execute } = useUnfollowUser(targetUserId)
      await execute()
      isFollowing.value = false
    } finally {
      loading.value = false
    }
  }

  async function toggle() {
    if (isFollowing.value) {
      await unfollow()
    } else {
      await follow()
    }
  }

  return { isFollowing, loading, checkStatus, follow, unfollow, toggle }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/composables/useFollow.ts
git commit -m "feat: add useFollow composable"
```

---

### Task 5: PopularReview 关注按钮

**Files:**
- Modify: `frontend/src/views/Wander/component/PopularReview.vue`

- [ ] **Step 1: 更新 script setup 部分**

在 `PopularReview.vue` 的 `<script setup>` 中：

1. 添加 import：
```typescript
import { computed, ref, onMounted } from 'vue'
import { NAvatar, NRate, NButton, NIcon } from 'naive-ui'
import { HeartIcon, MessageCircleCodeIcon, PlusCircle, CheckCircle2 } from 'lucide-vue-next'
import { useDialog } from 'naive-ui'
import ReviewDialog from './ReviewDialog.vue'
import { toggleLikeReview } from '@/api/reviews'
import router from '@/router'
import { useUserStore } from '@/stores/useUser'
import { useFollow } from '@/composables/useFollow'
```

2. 添加关注逻辑（在 `const userStore = useUserStore()` 之后）：
```typescript
const dialog = useDialog()

const isOwnReview = computed(() => {
  return userStore.user?._id === props.data.author?._id
})

const authorId = computed(() => props.data.author?._id || '')

const {
  isFollowing,
  loading: followLoading,
  checkStatus: checkFollowStatus,
} = useFollow(authorId.value)

onMounted(() => {
  if (userStore.isLoggedIn && authorId.value && !isOwnReview.value) {
    checkFollowStatus()
  }
})

const handleFollow = async () => {
  if (!userStore.requireLogin()) return
  if (!authorId.value) return

  if (isFollowing.value) {
    dialog.warning({
      title: '取消关注',
      content: `确定取消关注 ${props.data.author.username} 吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        const { unfollow } = useFollow(authorId.value)
        await unfollow()
        isFollowing.value = false
      },
    })
  } else {
    const { follow } = useFollow(authorId.value)
    await follow()
    isFollowing.value = true
  }
}
```

- [ ] **Step 2: 更新 template 中的按钮**

将 `PopularReview.vue` 中的 PlusCircle 按钮（第 155-159 行）替换为：

```html
<NButton
  v-if="!isOwnReview && authorId"
  tertiary
  circle
  size="small"
  :color="isFollowing ? '#22c55e' : '#8a2be2'"
  :disabled="followLoading"
  @click="handleFollow"
>
  <template #icon>
    <NIcon>
      <CheckCircle2 v-if="isFollowing" :size="20" />
      <PlusCircle v-else :size="20" />
    </NIcon>
  </template>
</NButton>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/views/Wander/component/PopularReview.vue
git commit -m "feat: add follow/unfollow button to PopularReview"
```

---

### Task 6: FollowDrawer 组件

**Files:**
- Create: `frontend/src/views/UserCenter/FollowDrawer.vue`

- [ ] **Step 1: 创建 FollowDrawer 组件**

```vue
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NDrawer, NDrawerContent, NAvatar, NButton, useDialog, useMessage } from 'naive-ui'
import { useFollowingList, useFollowersList, type FollowUserInfo } from '@/api/follow'
import { useFollow } from '@/composables/useFollow'
import { useUserStore } from '@/stores/useUser'

const props = defineProps<{
  visible: boolean
  type: 'following' | 'followers'
  userId: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'stats-changed': []
}>()

const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const userStore = useUserStore()

const items = ref<FollowUserInfo[]>([])
const loading = ref(false)
const total = ref(0)

const title = computed(() => props.type === 'following' ? '我的关注' : '我的粉丝')

const loadList = async () => {
  if (!props.userId) return
  loading.value = true
  try {
    const fetcher = props.type === 'following'
      ? useFollowingList(props.userId, { page: 1, limit: 50 })
      : useFollowersList(props.userId, { page: 1, limit: 50 })
    const data = await fetcher.execute()
    items.value = data.items
    total.value = data.total
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (val) => { if (val) loadList() },
)

const handleClose = () => {
  emit('update:visible', false)
}

const goToProfile = (userId: string) => {
  handleClose()
  router.push({ name: 'userProfile', params: { userId } })
}

const handleUnfollow = (user: FollowUserInfo) => {
  dialog.warning({
    title: '取消关注',
    content: `确定取消关注 ${user.username} 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { unfollow } = useFollow(user._id)
      await unfollow()
      items.value = items.value.filter((i) => i._id !== user._id)
      total.value = Math.max(0, total.value - 1)
      emit('stats-changed')
      message.success('已取消关注')
    },
  })
}

const handleFollow = async (user: FollowUserInfo) => {
  const { follow } = useFollow(user._id)
  await follow()
  emit('stats-changed')
  message.success('已关注')
  await loadList()
}

const isCurrentUser = (userId: string) => userStore.user?._id === userId
</script>

<template>
  <NDrawer :show="visible" :width="360" placement="right" @update:show="handleClose">
    <NDrawerContent :title="title" closable>
      <div v-if="loading" class="text-sm text-gray-500 py-4 text-center">加载中…</div>
      <div v-else-if="!items.length" class="text-sm text-gray-500 py-8 text-center">
        {{ type === 'following' ? '还没有关注任何人' : '还没有粉丝' }}
      </div>
      <div v-else class="flex flex-col gap-3">
        <div
          v-for="user in items"
          :key="user._id"
          class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <NAvatar
            round
            :size="40"
            :src="user.avatar || 'https://github.com/shadcn.png'"
            class="cursor-pointer shrink-0 border border-black"
            @click="goToProfile(user._id)"
          />
          <div
            class="flex-1 min-w-0 cursor-pointer"
            @click="goToProfile(user._id)"
          >
            <div class="text-sm font-bold truncate">{{ user.username }}</div>
            <div class="text-xs text-gray-500 truncate">{{ user.bio || '这个人很懒' }}</div>
          </div>
          <NButton
            v-if="!isCurrentUser(user._id)"
            size="tiny"
            :type="type === 'following' ? 'default' : 'primary'"
            secondary
            round
            @click.stop="type === 'following' ? handleUnfollow(user) : handleFollow(user)"
          >
            {{ type === 'following' ? '已关注' : '关注' }}
          </NButton>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/UserCenter/FollowDrawer.vue
git commit -m "feat: add FollowDrawer component"
```

---

### Task 7: UserCenter 统计栏 + 抽屉集成

**Files:**
- Modify: `frontend/src/views/UserCenter/index.vue`

- [ ] **Step 1: 添加 import 和抽屉状态**

在 `UserCenter/index.vue` 的 `<script setup>` 中添加：

1. 在 import 区添加 `FollowDrawer`：
```typescript
import FollowDrawer from './FollowDrawer.vue'
```

2. 在 `const user = computed(...)` 之后添加抽屉状态：
```typescript
const drawerVisible = ref(false)
const drawerType = ref<'following' | 'followers'>('following')

const openFollowDrawer = (type: 'following' | 'followers') => {
  if (!user.value) {
    message.warning('请先登录')
    return
  }
  drawerType.value = type
  drawerVisible.value = true
}

const handleStatsChanged = () => {
  userStore.setUser({
    ...user.value!,
    stats: {
      ...user.value!.stats!,
      following: (user.value!.stats?.following ?? 0) + (drawerType.value === 'following' ? -1 : 1),
      followers: user.value!.stats?.followers ?? 0,
      reviews: user.value!.stats?.reviews ?? 0,
    },
  })
}
```

- [ ] **Step 2: 在 template 中添加统计栏**

在 `UserCenter/index.vue` 的 template 中，在用户名/bio 区块（`<div class="flex-1 min-w-0">` 内部）的非编辑状态中添加统计数字。

将原来的：
```html
<template v-if="!editing">
  <div class="text-2xl font-extrabold truncate">
    {{ user?.username || '未登录用户' }}
  </div>
  <div class="text-sm text-gray-500 mt-1 truncate">
    {{ user?.bio || '查看我的评价与收藏' }}
  </div>
</template>
```

替换为：
```html
<template v-if="!editing">
  <div class="text-2xl font-extrabold truncate">
    {{ user?.username || '未登录用户' }}
  </div>
  <div class="text-sm text-gray-500 mt-1 truncate">
    {{ user?.bio || '查看我的评价与收藏' }}
  </div>
  <div v-if="user" class="mt-2 flex items-center gap-4 text-sm">
    <span
      class="cursor-pointer hover:underline"
      @click="openFollowDrawer('following')"
    >
      <span class="font-bold text-black">{{ user.stats?.following ?? 0 }}</span>
      <span class="text-gray-500 ml-1">关注</span>
    </span>
    <span class="text-gray-300">|</span>
    <span
      class="cursor-pointer hover:underline"
      @click="openFollowDrawer('followers')"
    >
      <span class="font-bold text-black">{{ user.stats?.followers ?? 0 }}</span>
      <span class="text-gray-500 ml-1">粉丝</span>
    </span>
  </div>
</template>
```

- [ ] **Step 3: 在 template 末尾添加 FollowDrawer**

在 `</NTabs>` 之后、`</div>`（最外层）之前添加：

```html
<FollowDrawer
  v-if="user"
  v-model:visible="drawerVisible"
  :type="drawerType"
  :user-id="user._id"
  @stats-changed="handleStatsChanged"
/>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/views/UserCenter/index.vue
git commit -m "feat: add follow stats bar and drawer to UserCenter"
```

---

### Task 8: 为 Follow 模型添加复合唯一索引

**Files:**
- Modify: `backend/src/models/follow.model.js`

- [ ] **Step 1: 添加复合唯一索引防止重复关注**

在 `follow.model.js` 中，在 `const Follow = mongoose.model(...)` 之前追加：

```javascript
followSchema.index({ follower: 1, following: 1 }, { unique: true });
```

这样即使并发请求也不会产生重复的关注记录。

- [ ] **Step 2: Commit**

```bash
git add backend/src/models/follow.model.js
git commit -m "feat: add unique compound index on Follow model"
```

---

### Task 9: 端到端验证

- [ ] **Step 1: 启动后端**

```bash
cd backend && pnpm dev
```

确认无启动报错。

- [ ] **Step 2: 启动前端**

```bash
cd frontend && pnpm dev
```

确认无编译报错。

- [ ] **Step 3: 功能验证 checklist**

1. 登录后访问 Wander 页面，确认他人的影评卡片显示 PlusCircle 关注按钮
2. 自己发布的影评不显示关注按钮
3. 点击 PlusCircle → 按钮变为 CheckCircle2（绿色）
4. 再次点击 CheckCircle2 → 弹出确认弹窗 → 确认后恢复为 PlusCircle
5. 访问个人中心，头像下方显示「关注 X | 粉丝 X」
6. 点击关注数字 → 右侧抽屉滑出，显示关注列表
7. 抽屉内点击用户头像/名称 → 跳转到 `/user/:userId`
8. 抽屉内点击「已关注」按钮 → 弹出确认 → 取消关注 → 用户从列表移除
