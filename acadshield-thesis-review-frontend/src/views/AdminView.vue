<template>
  <div class="admin-view">
    <div class="view-header">
      <h1>教务工作台</h1>
      <p>全局评审管理与成绩定稿</p>
    </div>

    <section class="stats-section section">
      <div class="stats-grid">
        <div class="card-dark stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总提交</div>
        </div>
        <div class="card-dark stat-card">
          <div class="stat-value">{{ stats.submitted }}</div>
          <div class="stat-label">待评审</div>
        </div>
        <div class="card-dark stat-card">
          <div class="stat-value">{{ stats.underReview }}</div>
          <div class="stat-label">评审中</div>
        </div>
        <div class="card-dark stat-card">
          <div class="stat-value">{{ stats.finalized }}</div>
          <div class="stat-label">已定稿</div>
        </div>
        <div class="card-dark stat-card">
          <div class="stat-value">{{ stats.rejected }}</div>
          <div class="stat-label">已驳回</div>
        </div>
      </div>
    </section>

    <div class="content-layout">
      <div class="main-content">
        <section class="thesis-table-section section">
          <h2 class="section-title">全部论文</h2>
          <a-table
            :columns="columns"
            :data-source="theses"
            :loading="loading"
            row-key="id"
            @row-click="handleSelectThesis"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'state'">
                <RoleBadge :state="Number(record.state)" />
              </template>
              <template v-if="column.key === 'reviewer'">
                <span v-if="record.reviewer && record.reviewer !== '0x0000000000000000000000000000000000000000'" class="mono address-text">
                  {{ shortenAddress(record.reviewer) }}
                </span>
                <span v-else class="no-reviewer">-</span>
              </template>
              <template v-if="column.key === 'score'">
                {{ record.score > 0 ? record.score : '-' }}
              </template>
            </template>
          </a-table>
        </section>

        <section class="events-section section">
          <h2 class="section-title">Recent Contract Events</h2>
          <div class="event-log">
            <div v-for="(event, index) in events" :key="index" class="event-log-item">
              <span class="event-name">{{ event.name }}</span>
              <span class="event-value"> #{{ event.thesisId }}</span>
              <span v-if="event.score" class="event-value"> Score: {{ event.score }}</span>
              <span class="event-time">{{ event.time }}</span>
            </div>
            <div v-if="events.length === 0" class="event-log-item">
              <span class="event-name">等待事件...</span>
            </div>
          </div>
        </section>
      </div>

      <div class="side-content">
        <section v-if="selectedThesis" class="action-panel">
          <h3>论文详情</h3>
          <div class="thesis-detail">
            <p><strong>编号：</strong>{{ selectedThesis.id }}</p>
            <p><strong>提交者：</strong><code class="mono">{{ shortenAddress(selectedThesis.submitter) }}</code></p>
            <p><strong>CID：</strong><code class="mono">{{ selectedThesis.thesisCID }}</code></p>
            <p>
              <strong>状态：</strong>
              <RoleBadge :state="Number(selectedThesis.state)" />
            </p>
            <p v-if="selectedThesis.reviewer && selectedThesis.reviewer !== '0x0000000000000000000000000000000000000000'">
              <strong>评审者：</strong>
              <code class="mono">{{ shortenAddress(selectedThesis.reviewer) }}</code>
            </p>
            <p v-if="selectedThesis.score > 0">
              <strong>分数：</strong>{{ selectedThesis.score }}
            </p>
            <p v-if="selectedThesis.reviewCID">
              <strong>评语：</strong>
              <code class="mono">{{ selectedThesis.reviewCID }}</code>
            </p>
          </div>

          <div class="action-buttons">
            <a-button
              v-if="Number(selectedThesis.state) === 2"
              type="primary"
              block
              @click="handleFinalize"
              :loading="finalizing"
              :disabled="!isConnected || userRole !== 'ADMIN_ROLE'"
            >
              定稿锁定
            </a-button>
            <a-button
              v-if="Number(selectedThesis.state) === 1 || Number(selectedThesis.state) === 2"
              danger
              block
              @click="handleReject"
              :loading="rejecting"
              :disabled="!isConnected || userRole !== 'ADMIN_ROLE'"
            >
              驳回论文
            </a-button>
          </div>
        </section>

        <section v-else class="action-panel empty-panel">
          <p>点击论文查看详情</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useWeb3 } from '../composables/useWeb3'
import RoleBadge from '../components/RoleBadge.vue'

const {
  isConnected,
  userRole,
  contract,
  finalizeGrade,
  rejectThesis,
  getThesisCount,
  getThesisDetails,
} = useWeb3()

const loading = ref(false)
const finalizing = ref(false)
const rejecting = ref(false)
const theses = ref([])
const selectedThesis = ref(null)
const events = ref([])

const stats = computed(() => {
  const result = { total: 0, submitted: 0, underReview: 0, finalized: 0, rejected: 0 }
  theses.value.forEach((thesis) => {
    result.total++
    switch (Number(thesis.state)) {
      case 1: result.submitted++; break
      case 2: result.underReview++; break
      case 3: result.finalized++; break
      case 4: result.rejected++; break
    }
  })
  return result
})

const columns = [
  { title: '编号', dataIndex: 'id', key: 'id', width: 80 },
  { title: '提交者', dataIndex: 'submitter', key: 'submitter', width: 150, ellipsis: true },
  { title: '状态', dataIndex: 'state', key: 'state', width: 100 },
  { title: '评审者', dataIndex: 'reviewer', key: 'reviewer', width: 150 },
  { title: '分数', dataIndex: 'score', key: 'score', width: 80 },
]

const shortenAddress = (address) => {
  if (!address || address === '0x0000000000000000000000000000000000000000') return '-'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const handleSelectThesis = (thesis) => {
  selectedThesis.value = thesis
}

const handleFinalize = async () => {
  if (!selectedThesis.value) return

  finalizing.value = true
  try {
    await finalizeGrade(selectedThesis.value.id)
    message.success('成绩定稿成功')
    await loadTheses()
    selectedThesis.value = null
  } catch (error) {
    message.error('定稿失败: ' + error.message)
  } finally {
    finalizing.value = false
  }
}

const handleReject = async () => {
  if (!selectedThesis.value) return

  rejecting.value = true
  try {
    await rejectThesis(selectedThesis.value.id)
    message.success('论文已驳回')
    await loadTheses()
    selectedThesis.value = null
  } catch (error) {
    message.error('驳回失败: ' + error.message)
  } finally {
    rejecting.value = false
  }
}

const loadTheses = async () => {
  loading.value = true
  try {
    const count = await getThesisCount()
    const thesisList = []

    for (let i = 0; i < Number(count); i++) {
      const thesis = await getThesisDetails(i)
      thesisList.push({
        id: Number(thesis.id),
        submitter: thesis.submitter,
        thesisCID: thesis.thesisCID,
        state: Number(thesis.state),
        score: Number(thesis.score),
        reviewer: thesis.reviewer,
        reviewCID: thesis.reviewCID,
      })
    }

    theses.value = thesisList.reverse()
  } catch (error) {
    console.error('Failed to load theses:', error)
  } finally {
    loading.value = false
  }
}

const setupEventListener = () => {
  if (!contract.value) return

  const addEvent = (name, thesisId, score = null) => {
    events.value.unshift({
      name,
      thesisId: Number(thesisId),
      score: score ? Number(score) : null,
      time: new Date().toLocaleTimeString('zh-CN'),
    })
    if (events.value.length > 20) {
      events.value = events.value.slice(0, 20)
    }
  }

  contract.value.on('ThesisSubmitted', (thesisId, submitter, thesisCID, timestamp) => {
    addEvent('ThesisSubmitted', thesisId)
    loadTheses()
  })

  contract.value.on('ThesisReviewed', (thesisId, reviewer, score, reviewCID) => {
    addEvent('ThesisReviewed', thesisId, score)
    loadTheses()
  })

  contract.value.on('GradeFinalized', (thesisId, finalScore) => {
    addEvent('GradeFinalized', thesisId, finalScore)
    loadTheses()
  })

  contract.value.on('ThesisRejected', (thesisId, admin, timestamp) => {
    addEvent('ThesisRejected', thesisId)
    loadTheses()
  })
}

onMounted(() => {
  if (isConnected.value) {
    loadTheses()
    setupEventListener()
  }
})
</script>

<style scoped>
.admin-view {
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  margin-bottom: 32px;
}

.view-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.view-header p {
  font-size: 16px;
  color: #64748B;
}

.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.content-layout {
  display: flex;
  gap: 32px;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.side-content {
  width: 320px;
  flex-shrink: 0;
}

.thesis-table-section {
  margin-bottom: 32px;
}

.events-section {
  margin-bottom: 32px;
}

.action-panel {
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #E2DFD6;
}

.action-panel h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
}

.thesis-detail {
  margin-bottom: 24px;
}

.thesis-detail p {
  margin-bottom: 12px;
  font-size: 14px;
  color: #64748B;
}

.thesis-detail strong {
  color: #0F172A;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-buttons :deep(.ant-btn-primary) {
  background: #1E3A8A;
  border-color: #1E3A8A;
}

.empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.empty-panel p {
  color: #94A3B8;
  font-size: 14px;
}

.address-text {
  font-size: 12px;
  background: #F1F5F9;
  padding: 2px 6px;
  border-radius: 4px;
}

.no-reviewer {
  color: #94A3B8;
}
</style>
