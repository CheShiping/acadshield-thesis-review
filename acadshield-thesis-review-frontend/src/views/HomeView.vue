<template>
  <div class="home-view">
    <section class="hero-section section">
      <div class="hero-content">
        <div class="hero-badge">盾</div>
        <h1 class="hero-title">把毕设评审写进不可篡改的区块</h1>
        <p class="hero-subtitle">
          基于区块链技术的可信毕设评审系统，确保论文提交时间不可篡改、
          导师评分过程透明可追溯、最终成绩永久锁定无法修改
        </p>
        <div class="hero-actions">
          <a-button type="primary" size="large" @click="$router.push('/student')">
            开始提交论文
          </a-button>
          <a-button size="large" @click="$router.push('/reviewer')">
            进入评审工作台
          </a-button>
        </div>
      </div>
      <div class="hero-meta">
        <div class="meta-item">
          <div class="meta-value">{{ thesisCount }}</div>
          <div class="meta-label">已存证论文</div>
        </div>
        <div class="meta-item">
          <div class="meta-value">3</div>
          <div class="meta-label">评审导师</div>
        </div>
        <div class="meta-item">
          <div class="meta-value">~2h</div>
          <div class="meta-label">平均定稿耗时</div>
        </div>
      </div>
    </section>

    <section class="workflow-section section">
      <h2 class="section-title">工作流程</h2>
      <div class="workflow-cards">
        <div class="workflow-card">
          <div class="workflow-step">1</div>
          <h3>学生提交</h3>
          <p>上传论文 PDF 至 IPFS，获取唯一 CID，调用智能合约存证</p>
          <code class="workflow-function">submitThesis(string thesisCID)</code>
        </div>
        <div class="workflow-arrow">→</div>
        <div class="workflow-card">
          <div class="workflow-step">2</div>
          <h3>导师评审</h3>
          <p>查看待审论文，评分并撰写评语，评语上传 IPFS 后上链</p>
          <code class="workflow-function">reviewThesis(uint256 id, uint8 score, string reviewCID)</code>
        </div>
        <div class="workflow-arrow">→</div>
        <div class="workflow-card">
          <div class="workflow-step">3</div>
          <h3>教务锁定</h3>
          <p>审核评审结果，一键锁定成绩，永久写入区块链</p>
          <code class="workflow-function">finalizeGrade(uint256 id)</code>
        </div>
      </div>
    </section>

    <section class="architecture-section section">
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
import { useWalletStore } from '../stores/wallet'

const wallet = useWalletStore()

const thesisCount = ref(0)

onMounted(async () => {
  try {
    if (wallet.isConnected && wallet.contract) {
      const count = await wallet.getThesisCount()
      thesisCount.value = Number(count)
    }
  } catch (error) {
    console.error('Failed to fetch thesis count:', error)
  }
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

.hero-actions :deep(.ant-btn-primary) {
  background: #1E3A8A;
  border-color: #1E3A8A;
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
}

.hero-actions :deep(.ant-btn-default) {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
  border-color: #0F172A;
  color: #0F172A;
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
