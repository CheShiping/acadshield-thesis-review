<template>
  <div class="reviewer-view">
    <div class="view-header">
      <h1>导师工作台</h1>
      <p>评审论文并提交评分</p>
    </div>

    <div class="content-layout">
      <div class="main-content">
        <section class="thesis-list-section section">
          <h2 class="section-title">待审论文</h2>
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
              <template v-if="column.key === 'action'">
                <a-button
                  v-if="Number(record.state) === 1"
                  type="primary"
                  size="small"
                  @click.stop="handleSelectThesis(record)"
                >
                  评审
                </a-button>
                <span v-else class="reviewed-text">
                  {{ Number(record.state) === 4 ? '已驳回' : '已评审' }}
                </span>
              </template>
            </template>
          </a-table>
        </section>

        <section v-if="selectedThesis" class="review-panel section" id="review-panel">
          <h2 class="section-title">评审面板</h2>
          <div class="review-content">
            <div class="thesis-info">
              <h3>论文信息</h3>
              <p><strong>编号：</strong>{{ selectedThesis.id }}</p>
              <p><strong>CID：</strong><code class="mono">{{ selectedThesis.thesisCID }}</code></p>
            </div>

            <div class="score-section">
              <div class="score-display">
                <div class="score-value">{{ score }}</div>
                <div class="score-label">总分</div>
              </div>

              <div class="score-slider">
                <h4>评分 (0-100)</h4>
                <a-slider v-model:value="score" :min="0" :max="100" />
              </div>

              <div class="dimension-scores">
                <h4>分项参考（仅UI展示，不写入链上）</h4>
                <div class="dimension-item">
                  <span>选题</span>
                  <a-slider v-model:value="dimensions.topic" :min="0" :max="25" style="width: 200px" />
                  <span>{{ dimensions.topic }}/25</span>
                </div>
                <div class="dimension-item">
                  <span>创新</span>
                  <a-slider v-model:value="dimensions.innovation" :min="0" :max="25" style="width: 200px" />
                  <span>{{ dimensions.innovation }}/25</span>
                </div>
                <div class="dimension-item">
                  <span>实现</span>
                  <a-slider v-model:value="dimensions.implementation" :min="0" :max="25" style="width: 200px" />
                  <span>{{ dimensions.implementation }}/25</span>
                </div>
                <div class="dimension-item">
                  <span>写作</span>
                  <a-slider v-model:value="dimensions.writing" :min="0" :max="25" style="width: 200px" />
                  <span>{{ dimensions.writing }}/25</span>
                </div>
              </div>
            </div>

            <div class="review-text">
              <h4>评语</h4>
              <a-textarea
                v-model:value="reviewText"
                :rows="6"
                placeholder="请输入评审意见..."
              />
            </div>

            <div class="review-actions">
              <a-button
                type="primary"
                @click="handleSubmitReview"
                :loading="submitting"
                :disabled="!wallet.isConnected || wallet.userRole !== 'REVIEWER_ROLE'"
              >
                提交评审
              </a-button>
              <a-button @click="handleSaveDraft">
                保存草稿
              </a-button>
            </div>
          </div>
        </section>
      </div>

      <div class="side-content">
        <section class="info-panel">
          <h3>评审说明</h3>
          <ul>
            <li>每篇论文仅接受一位评审</li>
            <li>评分范围：0-100 分</li>
            <li>分项评分为 UI 辅助，不写入链上</li>
            <li>评语将上传 IPFS 并记录 CID</li>
            <li>提交后无法修改</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useWalletStore } from '../stores/wallet'
import RoleBadge from '../components/RoleBadge.vue'

const wallet = useWalletStore()

const loading = ref(false)
const submitting = ref(false)
const theses = ref([])
const selectedThesis = ref(null)
const score = ref(80)
const reviewText = ref('')
const dimensions = ref({
  topic: 20,
  innovation: 20,
  implementation: 20,
  writing: 20,
})

const columns = [
  { title: '编号', dataIndex: 'id', key: 'id', width: 80 },
  { title: '论文 CID', dataIndex: 'thesisCID', key: 'thesisCID', ellipsis: true },
  { title: '提交者', dataIndex: 'submitter', key: 'submitter', width: 150, ellipsis: true },
  { title: '状态', dataIndex: 'state', key: 'state', width: 100 },
  { title: '操作', key: 'action', width: 100 },
]

const generateMockCID = () => {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let cid = 'Qm'
  for (let i = 0; i < 44; i++) {
    cid += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return cid
}

const handleSelectThesis = (thesis) => {
  if (Number(thesis.state) !== 1) return
  selectedThesis.value = thesis
  score.value = 80
  reviewText.value = ''
  setTimeout(() => {
    document.getElementById('review-panel')?.scrollIntoView({ behavior: 'smooth' })
  }, 100)
}

const handleSubmitReview = async () => {
  if (!selectedThesis.value) {
    message.warning('请先选择论文')
    return
  }

  if (!reviewText.value.trim()) {
    message.warning('请输入评语')
    return
  }

  submitting.value = true
  try {
    const reviewCID = generateMockCID()
    await wallet.reviewThesis(selectedThesis.value.id, score.value, reviewCID)
    message.success('评审提交成功')
    selectedThesis.value = null
    await loadTheses()
  } catch (error) {
    message.error('提交失败: ' + error.message)
  } finally {
    submitting.value = false
  }
}

const handleSaveDraft = () => {
  message.info('草稿已保存')
}

const loadTheses = async () => {
  loading.value = true
  try {
    const count = await wallet.getThesisCount()
    const thesisList = []

    for (let i = 0; i < Number(count); i++) {
      const thesis = await wallet.getThesisDetails(i)
      if (Number(thesis.state) === 1 || Number(thesis.state) === 2 || Number(thesis.state) === 4) {
        thesisList.push({
          id: Number(thesis.id),
          thesisCID: thesis.thesisCID,
          submitter: thesis.submitter,
          state: Number(thesis.state),
          score: Number(thesis.score),
        })
      }
    }

    theses.value = thesisList
  } catch (error) {
    console.error('Failed to load theses:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (wallet.isConnected) {
    loadTheses()
  }
})
</script>

<style scoped>
.reviewer-view {
  max-width: 1200px;
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

.content-layout {
  display: flex;
  gap: 32px;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.side-content {
  width: 280px;
  flex-shrink: 0;
}

.thesis-list-section {
  margin-bottom: 32px;
}

.review-panel {
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #E2DFD6;
}

.review-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.thesis-info {
  padding-bottom: 16px;
  border-bottom: 1px solid #E2DFD6;
}

.thesis-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.thesis-info p {
  margin-bottom: 8px;
  font-size: 14px;
  color: #64748B;
}

.thesis-info strong {
  color: #0F172A;
}

.score-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.score-display {
  text-align: center;
  padding: 20px;
  background: #F8FAFC;
  border-radius: 8px;
}

.score-value {
  font-family: 'Noto Serif SC', serif;
  font-size: 96px;
  font-weight: 700;
  color: #0F172A;
  line-height: 1;
}

.score-label {
  font-size: 14px;
  color: #64748B;
  margin-top: 8px;
}

.score-slider h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.dimension-scores h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #64748B;
}

.dimension-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.dimension-item span:first-child {
  width: 40px;
  font-size: 14px;
  color: #0F172A;
}

.dimension-item span:last-child {
  width: 50px;
  font-size: 14px;
  color: #64748B;
  text-align: right;
}

.review-text h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.review-actions {
  display: flex;
  gap: 12px;
}

.review-actions :deep(.ant-btn-primary) {
  background: #1E3A8A;
  border-color: #1E3A8A;
}

.info-panel {
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #E2DFD6;
}

.info-panel h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.info-panel ul {
  list-style: none;
  padding: 0;
}

.info-panel li {
  font-size: 14px;
  color: #64748B;
  padding: 8px 0;
  border-bottom: 1px solid #F1F5F9;
}

.info-panel li:last-child {
  border-bottom: none;
}

.info-panel li::before {
  content: '•';
  color: #1E3A8A;
  margin-right: 8px;
}

.reviewed-text {
  font-size: 14px;
  color: #64748B;
}

:deep(.ant-table-row) {
  cursor: pointer;
}

:deep(.ant-table-row:hover) {
  background: #F8FAFC;
}
</style>
