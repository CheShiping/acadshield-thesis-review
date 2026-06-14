<template>
  <div class="student-view">
    <div class="view-header" ref="viewHeader">
      <h1>学生工作台</h1>
      <p>提交论文并查看评审进度</p>
    </div>

    <div v-if="!wallet.isConnected" class="connect-prompt">
      <a-alert
        message="请先连接钱包"
        description="连接钱包后才能提交论文"
        type="info"
        show-icon
      />
    </div>

    <div class="content-layout">
      <div class="main-content">
        <section class="upload-section section" ref="uploadSection">
          <h2 class="section-title">提交论文</h2>
          <div class="upload-area" ref="uploadArea">
            <a-upload-dragger
              name="file"
              :multiple="false"
              :before-upload="handleBeforeUpload"
              :show-upload-list="false"
              :disabled="!wallet.isConnected"
            >
              <p class="upload-icon">
                <inbox-outlined />
              </p>
              <p class="upload-text">点击或拖拽文件到此区域上传</p>
              <p class="upload-hint">支持 PDF 格式的论文文件</p>
            </a-upload-dragger>

            <div v-if="selectedFile" class="file-info">
              <div class="file-meta">
                <p><strong>文件名：</strong>{{ selectedFile.name }}</p>
                <p><strong>大小：</strong>{{ formatFileSize(selectedFile.size) }}</p>
                <p><strong>CID：</strong><code class="mono">{{ mockCID }}</code></p>
              </div>
              <a-button
                type="primary"
                @click="handleSubmit"
                :loading="submitting"
                :disabled="!canSubmit"
              >
                {{ canSubmit ? '提交论文' : (wallet.isConnected ? '您的账号没有学生角色权限' : '请先连接钱包') }}
              </a-button>
            </div>
          </div>
        </section>

        <section class="history-section section" ref="historySection">
          <h2 class="section-title">提交历史</h2>
          <a-table
            :columns="columns"
            :data-source="theses"
            :loading="loading"
            row-key="id"
            :empty-text="wallet.isConnected ? '暂无提交记录' : '请连接钱包查看提交历史'"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'state'">
                <RoleBadge :state="Number(record.state)" />
              </template>
              <template v-if="column.key === 'score'">
                {{ record.score > 0 ? record.score : '-' }}
              </template>
              <template v-if="column.key === 'thesisCID'">
                <code class="mono cid-text">{{ record.thesisCID }}</code>
              </template>
            </template>
          </a-table>
        </section>
      </div>

      <div class="side-content" ref="sideContent">
        <section class="progress-section" ref="progressSection">
          <h3>提交进度</h3>
          <a-steps direction="vertical" :current="currentStep" :items="stepsItems" />
        </section>

        <section class="info-card">
          <div class="info-card-content">
            <h4>链下存文件 · 链上存凭证</h4>
            <p>论文 PDF 存储在 IPFS 网络，获取唯一 CID 哈希；CID 和元数据写入区块链，确保不可篡改。</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { gsap } from 'gsap'
import { useWalletStore } from '../stores/wallet'
import RoleBadge from '../components/RoleBadge.vue'

const wallet = useWalletStore()

const viewHeader = ref(null)
const uploadSection = ref(null)
const uploadArea = ref(null)
const historySection = ref(null)
const sideContent = ref(null)
const progressSection = ref(null)

const selectedFile = ref(null)
const mockCID = ref('')
const submitting = ref(false)
const loading = ref(false)
const theses = ref([])
const currentStep = ref(0)

const stepsItems = [
  { title: '选择文件', description: '选择论文 PDF 文件' },
  { title: '生成 CID', description: '模拟 IPFS 上传' },
  { title: '签名提交', description: 'MetaMask 签名确认' },
  { title: '等待评审', description: '导师评审中' },
  { title: '教务锁定', description: '成绩定稿' },
]

const columns = [
  { title: '编号', dataIndex: 'id', key: 'id', width: 80 },
  { title: '论文 CID', dataIndex: 'thesisCID', key: 'thesisCID', ellipsis: true },
  { title: '状态', dataIndex: 'state', key: 'state', width: 100 },
  { title: '分数', dataIndex: 'score', key: 'score', width: 80 },
  { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', width: 180 },
]

const canSubmit = computed(() => {
  return wallet.isConnected && wallet.userRole === 'STUDENT_ROLE' && selectedFile.value
})

const generateMockCID = () => {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let cid = 'Qm'
  for (let i = 0; i < 44; i++) {
    cid += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return cid
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / 1048576).toFixed(2) + ' MB'
}

const formatTimestamp = (timestamp) => {
  if (!timestamp || timestamp === 0) return '-'
  return new Date(Number(timestamp) * 1000).toLocaleString('zh-CN')
}

const handleBeforeUpload = (file) => {
  selectedFile.value = file
  mockCID.value = generateMockCID()
  currentStep.value = 1
  return false
}

const handleSubmit = async () => {
  if (!selectedFile.value) {
    message.warning('请先选择文件')
    return
  }

  submitting.value = true
  currentStep.value = 2

  try {
    await wallet.submitThesis(mockCID.value)
    message.success('论文提交成功！交易已上链')
    currentStep.value = 3
    selectedFile.value = null
    mockCID.value = ''
    await loadTheses()
  } catch (error) {
    console.error('Submit error:', error)
    message.error('提交失败: ' + (error.message || '未知错误'))
    currentStep.value = 1
  } finally {
    submitting.value = false
  }
}

const loadTheses = async () => {
  if (!wallet.account || !wallet.isConnected) return

  loading.value = true
  try {
    const thesisIds = await wallet.getStudentTheses(wallet.account)
    const thesisList = []

    for (const id of thesisIds) {
      const thesis = await wallet.getThesisDetails(Number(id))
      thesisList.push({
        id: Number(thesis.id),
        thesisCID: thesis.thesisCID,
        state: Number(thesis.state),
        score: Number(thesis.score),
        submittedAt: formatTimestamp(thesis.submittedAt),
      })
    }

    theses.value = thesisList.reverse()
  } catch (error) {
    console.error('Failed to load theses:', error)
    message.error('加载提交历史失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

watch(
  () => [wallet.isConnected, wallet.account],
  ([connected, acc]) => {
    if (connected && acc) {
      loadTheses()
    }
  },
)

onMounted(() => {
  if (wallet.isConnected && wallet.account) {
    loadTheses()
  }

  // 入场动画
  nextTick(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

    gsap.set([viewHeader.value, uploadSection.value, historySection.value, sideContent.value], {
      opacity: 0,
      y: 30,
    })

    tl
      .to(viewHeader.value, { opacity: 1, y: 0, duration: 0.5 }, 0)
      .to(uploadSection.value, { opacity: 1, y: 0, duration: 0.5 }, 0.1)
      .to(historySection.value, { opacity: 1, y: 0, duration: 0.5 }, 0.2)
      .to(sideContent.value, { opacity: 1, y: 0, duration: 0.5 }, 0.15)

    // 上传区域悬停效果
    if (uploadArea.value) {
      uploadArea.value.style.transition = 'box-shadow 0.3s ease, transform 0.3s ease'
      uploadArea.value.addEventListener('mouseenter', () => {
        gsap.to(uploadArea.value, { y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', duration: 0.3 })
      })
      uploadArea.value.addEventListener('mouseleave', () => {
        gsap.to(uploadArea.value, { y: 0, boxShadow: 'none', duration: 0.3 })
      })
    }
  })
})
</script>

<style scoped>
.student-view {
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

.connect-prompt {
  margin-bottom: 24px;
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

.upload-section {
  margin-bottom: 32px;
}

.upload-area {
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #E2DFD6;
}

.upload-icon {
  font-size: 48px;
  color: #94A3B8;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #0F172A;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: #64748B;
}

.file-info {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #E2DFD6;
}

.file-meta {
  margin-bottom: 16px;
}

.file-meta p {
  margin-bottom: 8px;
  font-size: 14px;
  color: #64748B;
}

.file-meta strong {
  color: #0F172A;
}

.cid-text {
  font-size: 12px;
  background: #F1F5F9;
  padding: 2px 6px;
  border-radius: 4px;
}

.history-section {
  margin-bottom: 32px;
}

.progress-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #E2DFD6;
  margin-bottom: 24px;
}

.progress-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
}

.info-card {
  background: #0F172A;
  border-radius: 8px;
  padding: 24px;
}

.info-card-content h4 {
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  font-weight: 600;
  color: #F5F1E8;
  margin-bottom: 12px;
}

.info-card-content p {
  font-size: 14px;
  color: #94A3B8;
  line-height: 1.6;
}

:deep(.ant-upload-drag) {
  background: #FAFAF8;
  border-color: #E2DFD6;
}

:deep(.ant-upload-drag:hover) {
  border-color: #1E3A8A;
}

:deep(.ant-btn-primary) {
  background: #1E3A8A;
  border-color: #1E3A8A;
}

:deep(.ant-btn[disabled]) {
  opacity: 0.5;
}
</style>
