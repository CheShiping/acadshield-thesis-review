# AcadShield 前端 GSAP 动画添加计划

## 概要

在 AcadShield 前端项目中集成 GSAP 动画库，为所有页面添加：
1. **淡入入场动画**（元素加载时依次淡入+上移）
2. **数字滚动动画**（统计数据动态递增）
3. **Hover 效果**（卡片悬停浮起、按钮交互等）

## 当前状态分析

### 项目依赖
- `package.json` 目前**没有 gsap 依赖**
- 使用 Vue 3 + Vite + Ant Design Vue
- 页面结构：
  - `App.vue` - 主布局（Header + Content + Footer）
  - `HomeView.vue` - 首页（英雄区 + 工作流程 + 架构图）
  - `StudentView.vue` - 学生端（上传区 + 历史表格）
  - `ReviewerView.vue` - 导师端（待审列表 + 评审面板）
  - `AdminView.vue` - 教务端（统计卡片 + 论文表格 + 角色管理）
  - `AppHeader.vue` - 顶部导航

### 现有 UI 结构
- 深色主题（`#0F172A`）+ 米色背景（`#F5F1E8`）
- 卡片式布局，圆角 8px
- 统计数字使用大号衬线字体

---

## 实施计划

### 阶段 1：安装 GSAP 依赖

**文件**: `acadshield-thesis-review-frontend/package.json`

```json
"dependencies": {
  "gsap": "^3.12.0"
}
```

执行命令：`npm install gsap`

---

### 阶段 2：创建动画复用 composable

**新建文件**: `src/composables/useAnimations.js`

```javascript
import { gsap } from 'gsap'

// 元素淡入入场动画
export const fadeInUp = (targets, options = {}) => {
  return gsap.fromTo(
    targets,
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: options.duration || 0.6,
      ease: 'power2.out',
      stagger: options.stagger || 0.1,
      delay: options.delay || 0,
    }
  )
}

// 数字滚动动画
export const countUp = (target, endValue, options = {}) => {
  const obj = { value: 0 }
  return gsap.to(obj, {
    value: endValue,
    duration: options.duration || 1.5,
    ease: 'power2.out',
    onUpdate: () => {
      if (typeof target === 'function') {
        target(Math.round(obj.value))
      } else {
        target.innerText = Math.round(obj.value)
      }
    },
  })
}

// 卡片悬停浮起
export const setupCardHover = (card, options = {}) => {
  gsap.set(card, { y: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' })

  card.addEventListener('mouseenter', () => {
    gsap.to(card, {
      y: -4,
      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
      duration: 0.3,
      ease: 'power2.out',
    })
  })

  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      y: 0,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      duration: 0.3,
      ease: 'power2.out',
    })
  })
}

export { gsap }
```

---

### 阶段 3：修改各页面组件

#### 3.1 HomeView.vue（首页）

**动画目标**：
- `.hero-badge` - 徽章缩放入场
- `.hero-title` + `.hero-subtitle` - 淡入上移
- `.hero-actions` 按钮 - 依次淡入
- `.hero-meta` 数字 - 滚动递增
- `.workflow-card` - 依次 stagger 入场
- `.workflow-card` hover - 浮起效果

**修改位置**：
```html
<!-- script setup -->
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { useWalletStore } from '../stores/wallet'

// onMounted 中添加动画逻辑
```

#### 3.2 StudentView.vue（学生端）

**动画目标**：
- `.view-header` - 淡入上移
- `.upload-area` 卡片 - 淡入入场
- `.history-section` 表格 - 淡入入场
- `.progress-section` - 淡入入场
- 各 section hover - 微浮起

#### 3.3 ReviewerView.vue（导师端）

**动画目标**：
- `.view-header` - 淡入上移
- `.thesis-list-section` - 淡入入场
- `.review-panel` - 滑入入场（当选中论文时）
- 评审面板内的评分数字 - 滚动递增

#### 3.4 AdminView.vue（教务端）

**动画目标**：
- `.view-header` - 淡入上移
- 5 个统计卡片 - stagger 入场
- 论文表格 - 淡入入场
- 角色管理表格 - 淡入入场

---

### 阶段 4：创建通用动画指令（可选增强）

**新建文件**: `src/directives/vAnimation.js`

```javascript
export const vAnimation = {
  mounted(el, binding) {
    const { type = 'fadeInUp', delay = 0, stagger = 0 } = binding.value || {}

    gsap.set(el, { opacity: 0, y: 20 })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              delay,
              ease: 'power2.out',
            })
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
  },
}
```

使用方式：
```html
<div v-animation="{ type: 'fadeInUp', delay: 0.2 }" class="workflow-card">
```

---

## 具体修改清单

| 文件 | 修改内容 |
|------|----------|
| `package.json` | 添加 gsap 依赖 |
| `src/composables/useAnimations.js` | 新建，封装动画函数 |
| `src/views/HomeView.vue` | 添加首页动画 |
| `src/views/StudentView.vue` | 添加学生端动画 |
| `src/views/ReviewerView.vue` | 添加导师端动画 |
| `src/views/AdminView.vue` | 添加教务端动画 |

---

## 验证步骤

1. 运行 `npm install` 安装 gsap
2. 启动开发服务器 `npm run dev`
3. 验证各页面：
   - [ ] 首页加载时元素依次淡入
   - [ ] 首页元数据数字递增动画
   - [ ] 工作流程卡片悬停浮起
   - [ ] 学生端各 section 入场动画
   - [ ] 导师端评审面板滑入动画
   - [ ] 教务端统计卡片 stagger 入场
4. 检查浏览器控制台无报错

---

## 假设与决策

1. **GSAP 版本**: 使用 v3.12.x（最新稳定版）
2. **动画风格**: 简洁、克制，配合现有深色主题
3. **性能考虑**: 使用 `will-change: transform` 优化动画性能
4. **兼容性**: 目标浏览器为现代浏览器（Chrome/Firefox/Edge）
