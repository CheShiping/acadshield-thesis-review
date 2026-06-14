<template>
  <div class="home-view">
    <section class="hero-section section">
      <div class="hero-content">
        <div class="hero-badge" ref="heroBadge">盾</div>
        <h1 class="hero-title" ref="heroTitle">把毕设评审写进不可篡改的区块</h1>
        <p class="hero-subtitle" ref="heroSubtitle">
          基于区块链技术的可信毕设评审系统，确保论文提交时间不可篡改、
          导师评分过程透明可追溯、最终成绩永久锁定无法修改
        </p>
        <div class="hero-actions" ref="heroActions">
          <button class="hero-btn hero-btn-primary" @click="$router.push('/student')">
            开始提交论文
            <span class="btn-arrow">→</span>
          </button>
          <button class="hero-btn hero-btn-secondary" @click="$router.push('/reviewer')">
            进入评审工作台
          </button>
        </div>
      </div>
      <div class="hero-meta" ref="heroMeta">
        <div class="meta-item">
          <div class="meta-value">{{ displayThesisCount }}</div>
          <div class="meta-label">已存证论文</div>
        </div>
        <div class="meta-item">
          <div class="meta-value" ref="reviewerCount">0</div>
          <div class="meta-label">评审导师</div>
        </div>
        <div class="meta-item">
          <div class="meta-value" ref="avgTime">~0h</div>
          <div class="meta-label">平均定稿耗时</div>
        </div>
      </div>
    </section>

    <section class="workflow-section section">
      <h2 class="section-title" ref="workflowTitle">工作流程</h2>
      <div class="workflow-cards">
        <div class="workflow-card" v-for="i in 3" :key="i" :ref="el => workflowCards[i-1] = el">
          <div class="workflow-step">{{ i }}</div>
          <h3>{{ workflowSteps[i-1].title }}</h3>
          <p>{{ workflowSteps[i-1].desc }}</p>
          <code class="workflow-function">{{ workflowSteps[i-1].func }}</code>
        </div>
      </div>
    </section>

    <section class="architecture-section section" ref="architectureSection">
      <h2 class="section-title">系统架构</h2>
      <div class="architecture-diagram card-dark">
        <pre class="architecture-ascii">
┌─────────────────────────────────────────────────────────────┐
│                      前端层 (Frontend)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   学生端    │  │   导师端    │  │   教务端    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│         │               │               │                   │
│         └───────────────┼───────────────┘                   │
│                         │ ethers.js                         │
├─────────────────────────┼───────────────────────────────────┤
│                    合约层 (Contract)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    AcadShield.sol                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ RBAC     │  │ State    │  │ Events   │          │   │
│  │  │ Control  │  │ Machine  │  │ Emitter  │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    文件层 (Storage)                          │
│  ┌────────────┐                      ┌────────────┐        │
│  │    IPFS    │  ←── CID Link ──→    │ Blockchain │        │
│  │  (链下)    │                      │   (链上)    │        │
│  └────────────┘                      └────────────┘        │
└─────────────────────────────────────────────────────────────┘
        </pre>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'
import { useWalletStore } from '../stores/wallet'

const wallet = useWalletStore()

const thesisCount = ref(0)
const displayThesisCount = ref(0)
const heroBadge = ref(null)
const heroTitle = ref(null)
const heroSubtitle = ref(null)
const heroActions = ref(null)
const heroMeta = ref(null)
const workflowTitle = ref(null)
const workflowCards = ref([])
const architectureSection = ref(null)
const reviewerCount = ref(null)
const avgTime = ref(null)

const workflowSteps = [
  { title: '学生提交', desc: '上传论文 PDF 至 IPFS，获取唯一 CID，调用智能合约存证', func: 'submitThesis(string thesisCID)' },
  { title: '导师评审', desc: '查看待审论文，评分并撰写评语，评语上传 IPFS 后上链', func: 'reviewThesis(uint256 id, uint8 score, string reviewCID)' },
  { title: '教务锁定', desc: '审核评审结果，一键锁定成绩，永久写入区块链', func: 'finalizeGrade(uint256 id)' },
]

onMounted(async () => {
  // 初始状态：所有元素透明且偏移
  gsap.set([heroBadge.value, heroTitle.value, heroSubtitle.value, heroActions.value], {
    opacity: 0,
    y: 40,
  })
  gsap.set(heroMeta.value, { opacity: 0, y: 30 })
  gsap.set(workflowTitle.value, { opacity: 0, y: 30 })
  gsap.set(workflowCards.value, { opacity: 0, y: 40, scale: 0.95 })
  gsap.set(architectureSection.value, { opacity: 0, y: 30 })

  // 英雄区入场动画
  const heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } })
  heroTl
    .to(heroBadge.value, { opacity: 1, y: 0, duration: 0.8, scale: 1 }, 0)
    .to(heroTitle.value, { opacity: 1, y: 0, duration: 0.8 }, 0.2)
    .to(heroSubtitle.value, { opacity: 1, y: 0, duration: 0.8 }, 0.4)
    .to(heroActions.value, { opacity: 1, y: 0, duration: 0.6 }, 0.6)
    .to(heroMeta.value, { opacity: 1, y: 0, duration: 0.6 }, 0.9)

  // 数字滚动动画
  try {
    if (wallet.isConnected && wallet.contract) {
      const count = await wallet.getThesisCount()
      thesisCount.value = Number(count)
    }
  } catch (error) {
    thesisCount.value = 0
  }

  // 论文数量滚动
  gsap.to(displayThesisCount, {
    value: thesisCount.value,
    duration: 1.5,
    ease: 'power2.out',
    delay: 1,
  })

  // 评审导师数字滚动 (目标: 3)
  gsap.to({ val: 0 }, {
    val: 3,
    duration: 1,
    ease: 'power2.out',
    delay: 1.2,
    onUpdate: function () {
      if (reviewerCount.value) {
        reviewerCount.value.innerText = Math.round(this.targets()[0].val)
      }
    },
  })

  // 工作流程区域动画
  gsap.to(workflowTitle.value, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: 'power2.out',
    delay: 0.8,
  })

  gsap.to(workflowCards.value, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.6,
    stagger: 0.15,
    ease: 'power2.out',
    delay: 1,
    onComplete: () => {
      // 卡片悬停效果
      workflowCards.value.forEach((card) => {
        if (!card) return
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease'
        card.addEventListener('mouseenter', () => {
          gsap.to(card, { y: -8, boxShadow: '0 16px 32px rgba(0,0,0,0.12)', duration: 0.3 })
        })
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { y: 0, boxShadow: 'none', duration: 0.3 })
        })
      })
    },
  })

  // 架构图动画
  gsap.to(architectureSection.value, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power2.out',
    delay: 1.5,
  })

  // 按钮交互动画
  const buttons = document.querySelectorAll('.hero-actions .hero-btn')
  buttons.forEach((btn) => {
    // 鼠标进入：上移 + 阴影加深
    btn.addEventListener('mouseenter', () => {
      gsap.to(btn, {
        y: -4,
        boxShadow: '0 8px 24px rgba(30, 64, 175, 0.35)',
        duration: 0.3,
        ease: 'power2.out',
      })
    })

    // 鼠标离开：恢复原位
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        y: 0,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        duration: 0.3,
        ease: 'power2.out',
      })
    })

    // 鼠标按下：缩放
    btn.addEventListener('mousedown', () => {
      gsap.to(btn, {
        scale: 0.96,
        duration: 0.1,
      })
    })

    // 鼠标释放：回弹
    btn.addEventListener('mouseup', () => {
      gsap.to(btn, {
        scale: 1,
        duration: 0.2,
        ease: 'elastic.out(1, 0.5)',
      })
    })
  })
})
</script>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  padding: 60px 0;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-badge {
  font-family: 'Noto Serif SC', serif;
  font-size: 72px;
  font-weight: 700;
  color: #0F172A;
  line-height: 1;
  margin-bottom: 24px;
  display: inline-block;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: #0F172A;
  margin-bottom: 20px;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 18px;
  color: #64748B;
  line-height: 1.6;
  margin-bottom: 40px;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.hero-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.hero-btn-primary {
  background: #1E3A8A;
  color: #F5F1E8;
}

.hero-btn-primary:hover {
  background: #1E40AF;
}

.hero-btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.hero-btn-primary:hover::before {
  left: 100%;
}

.hero-btn-secondary {
  background: transparent;
  color: #1E3A8A;
  border: 2px solid #1E3A8A;
}

.hero-btn-secondary:hover {
  background: #1E3A8A;
  color: #F5F1E8;
}

.btn-arrow {
  margin-left: 8px;
  transition: transform 0.3s ease;
}

.hero-btn:hover .btn-arrow {
  transform: translateX(4px);
}

.hero-meta {
  display: flex;
  justify-content: center;
  gap: 64px;
  margin-top: 60px;
  padding-top: 40px;
  border-top: 1px solid #E2DFD6;
}

.meta-item {
  text-align: center;
}

.meta-value {
  font-family: 'Noto Serif SC', serif;
  font-size: 36px;
  font-weight: 700;
  color: #0F172A;
  line-height: 1;
  margin-bottom: 8px;
  min-width: 80px;
}

.meta-label {
  font-size: 14px;
  color: #64748B;
}

.workflow-section {
  padding: 40px 0;
}

.workflow-cards {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.workflow-card {
  flex: 1;
  max-width: 300px;
  background: white;
  border-radius: 8px;
  padding: 32px 24px;
  text-align: center;
  border: 1px solid #E2DFD6;
  cursor: pointer;
}

.workflow-step {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #0F172A;
  color: #F5F1E8;
  font-family: 'Noto Serif SC', serif;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.workflow-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #0F172A;
}

.workflow-card p {
  font-size: 14px;
  color: #64748B;
  line-height: 1.6;
  margin-bottom: 16px;
}

.workflow-function {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #1E3A8A;
  background: #EFF6FF;
  padding: 4px 8px;
  border-radius: 4px;
}

.workflow-arrow {
  font-size: 24px;
  color: #94A3B8;
}

.architecture-section {
  padding: 40px 0;
}

.architecture-diagram {
  overflow-x: auto;
}

.architecture-ascii {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #94A3B8;
  margin: 0;
  white-space: pre;
}
</style>
