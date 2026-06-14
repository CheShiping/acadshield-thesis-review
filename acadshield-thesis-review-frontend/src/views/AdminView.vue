<template>
  <div class="admin-view">
    <div class="view-header">
      <h1>教务工作台</h1>
      <p>全局评审管理与角色分配</p>
    </div>

    <a-tabs v-model:activeKey="activeTab" class="admin-tabs">
      <a-tab-pane key="thesis" tab="论文管理">
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

        <section class="thesis-table-section section">
          <h2 class="section-title">全部论文</h2>
          <a-table
            :columns="columns"
            :data-source="theses"
            :loading="loading"
            row-key="id"
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
              <template v-if="column.key === 'submitter'">
                <span class="mono address-text">{{ shortenAddress(record.submitter) }}</span>
              </template>
              <template v-if="column.key === 'score'">
                {{ record.score > 0 ? record.score : '-' }}
              </template>
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button v-if="Number(record.state) === 2" type="primary" size="small" @click="handleFinalizeById(record.id)" :loading="finalizing === record.id">
                    定稿
                  </a-button>
                  <a-button v-if="Number(record.state) === 1 || Number(record.state) === 2" danger size="small" @click="handleRejectById(record.id)" :loading="rejecting === record.id">
                    驳回
                  </a-button>
                  <span v-else class="no-action">已完成</span>
                </a-space>
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
      </a-tab-pane>

      <a-tab-pane key="roles" tab="角色管理">
        <section class="role-manage-section section">
          <div class="role-header">
            <h2 class="section-title">角色分配表格</h2>
            <p class="section-desc">查看所有地址的角色分配，可分配或撤销角色</p>
          </div>

          <div class="role-form">
            <a-form layout="inline" :model="roleForm">
              <a-form-item label="钱包地址" style="flex: 1; min-width: 400px;">
                <a-input v-model:value="roleForm.address" placeholder="0x..." style="width: 100%;" />
              </a-form-item>
              <a-form-item>
                <a-space>
                  <a-button type="primary" :loading="querying" @click="handleQueryRole">查询/添加到表格</a-button>
                </a-space>
              </a-form-item>
            </a-form>
          </div>

          <a-table
            :columns="roleColumns"
            :data-source="roleList"
            :loading="roleLoading"
            row-key="address"
            :pagination="false"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'address'">
                <span class="mono address-long">{{ record.address }}</span>
              </template>
              <template v-if="column.key === 'isStudent'">
                <a-tag v-if="record.isStudent" color="orange">已分配</a-tag>
                <span v-else style="color: #94A3B8;">未分配</span>
              </template>
              <template v-if="column.key === 'isReviewer'">
                <a-tag v-if="record.isReviewer" color="blue">已分配</a-tag>
                <span v-else style="color: #94A3B8;">未分配</span>
              </template>
              <template v-if="column.key === 'isAdmin'">
                <a-tag v-if="record.isAdmin" color="green">已分配</a-tag>
                <span v-else style="color: #94A3B8;">未分配</span>
              </template>
              <template v-if="column.key === 'actions'">
                <a-space>
                  <a-button
                    size="small"
                    :type="record.isStudent ? 'default' : 'primary'"
                    :loading="busyAddress === record.address && busyRole === 'STUDENT_ROLE'"
                    @click="record.isStudent ? handleToggle('STUDENT_ROLE', record.address) : handleToggle('STUDENT_ROLE', record.address)"
                  >
                    {{ record.isStudent ? '撤销学生' : '分配学生' }}
                  </a-button>
                  <a-button
                    size="small"
                    :type="record.isReviewer ? 'default' : 'primary'"
                    :loading="busyAddress === record.address && busyRole === 'REVIEWER_ROLE'"
                    @click="handleToggle('REVIEWER_ROLE', record.address)"
                  >
                    {{ record.isReviewer ? '撤销导师' : '分配导师' }}
                  </a-button>
                  <a-button
                    size="small"
                    :type="record.isAdmin ? 'default' : 'primary'"
                    :loading="busyAddress === record.address && busyRole === 'ADMIN_ROLE'"
                    @click="handleToggle('ADMIN_ROLE', record.address)"
                  >
                    {{ record.isAdmin ? '撤销管理员' : '分配管理员' }}
                  </a-button>
                </a-space>
              </template>
            </template>
          </a-table>

          <a-alert class="role-alert" type="info" show-icon style="margin-top: 16px;">
            <template #message>说明</template>
            <template #description>
              <ul>
                <li>新钱包地址连接后默认<strong>无角色</strong>，需要管理员在此分配后才能使用对应功能</li>
                <li>一个地址可同时拥有多个角色（如既是导师又是管理员）</li>
                <li>角色分配和撤销均需签名交易，会消耗少量 ETH（测试网 ETH）</li>
                <li>输入地址点击"查询/添加到表格"可查看该地址角色状态，并将其添加到下方表格</li>
              </ul>
            </template>
          </a-alert>

          <div class="current-role">
            <h3>当前账号角色</h3>
            <p>
              <span class="mono">{{ account || '未连接' }}</span>
              <span v-if="userRole === 'ADMIN_ROLE'" class="role-tag role-admin">当前角色: ADMIN</span>
              <span v-else-if="userRole === 'REVIEWER_ROLE'" class="role-tag role-reviewer">当前角色: REVIEWER</span>
              <span v-else-if="userRole === 'STUDENT_ROLE'" class="role-tag role-student">当前角色: STUDENT</span>
              <span v-else class="role-tag role-none">未分配角色</span>
            </p>
          </div>
        </section>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useWeb3 } from '../composables/useWeb3'
import RoleBadge from '../components/RoleBadge.vue'

const {
  account,
  userRole,
  contract,
  STUDENT_ROLE,
  REVIEWER_ROLE,
  ADMIN_ROLE,
  finalizeGrade,
  rejectThesis,
  getThesisCount,
  getThesisDetails,
  grantRole,
  revokeRole,
  getAccountRoles,
} = useWeb3()

const activeTab = ref('thesis')
const loading = ref(false)
const finalizing = ref(null)
const rejecting = ref(null)
const querying = ref(false)
const roleLoading = ref(false)
const busyAddress = ref(null)
const busyRole = ref(null)
const theses = ref([])
const events = ref([])

const roleForm = ref({
  address: '',
  role: 'STUDENT_ROLE',
})

const roleList = ref([])

const roleMap = {
  STUDENT_ROLE: STUDENT_ROLE,
  REVIEWER_ROLE: REVIEWER_ROLE,
  ADMIN_ROLE: ADMIN_ROLE,
}

const roleColumns = [
  { title: '钱包地址', dataIndex: 'address', key: 'address', width: 380 },
  { title: '学生角色', dataIndex: 'isStudent', key: 'isStudent', width: 100, align: 'center' },
  { title: '导师角色', dataIndex: 'isReviewer', key: 'isReviewer', width: 100, align: 'center' },
  { title: '管理员角色', dataIndex: 'isAdmin', key: 'isAdmin', width: 110, align: 'center' },
  { title: '操作', key: 'actions', width: 420 },
]

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
  { title: '提交者', dataIndex: 'submitter', key: 'submitter', width: 160, ellipsis: true },
  { title: '状态', dataIndex: 'state', key: 'state', width: 100 },
  { title: '评审者', dataIndex: 'reviewer', key: 'reviewer', width: 160 },
  { title: '分数', dataIndex: 'score', key: 'score', width: 80 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
]

const shortenAddress = (address) => {
  if (!address || address === '0x0000000000000000000000000000000000000000') return '-'
  return `${address.slice(0, 10)}...${address.slice(-6)}`
}

const handleFinalizeById = async (id) => {
  finalizing.value = id
  try {
    await finalizeGrade(id)
    message.success('成绩定稿成功')
    await loadTheses()
  } catch (error) {
    message.error('定稿失败: ' + (error.message || error))
  } finally {
    finalizing.value = null
  }
}

const handleRejectById = async (id) => {
  rejecting.value = id
  try {
    await rejectThesis(id)
    message.success('论文已驳回')
    await loadTheses()
  } catch (error) {
    message.error('驳回失败: ' + (error.message || error))
  } finally {
    rejecting.value = null
  }
}

const handleQueryRole = async () => {
  const addr = roleForm.value.address.trim()
  if (!addr) {
    message.warning('请输入钱包地址')
    return
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    message.error('请输入有效的钱包地址 (0x开头, 42位)')
    return
  }

  querying.value = true
  try {
    const roles = await getAccountRoles(addr)
    const newRecord = {
      address: addr,
      isStudent: roles.isStudent,
      isReviewer: roles.isReviewer,
      isAdmin: roles.isAdmin,
    }

    const existingIndex = roleList.value.findIndex((r) => r.address.toLowerCase() === addr.toLowerCase())
    if (existingIndex >= 0) {
      roleList.value[existingIndex] = newRecord
      roleList.value = [...roleList.value]
    } else {
      roleList.value = [newRecord, ...roleList.value]
    }

    roleForm.value.address = ''
    message.success('查询成功')
  } catch (error) {
    message.error('查询失败: ' + (error.message || error))
  } finally {
    querying.value = false
  }
}

const handleToggle = async (roleName, addr) => {
  const record = roleList.value.find((r) => r.address.toLowerCase() === addr.toLowerCase())
  if (!record) return

  const currentState = {
    STUDENT_ROLE: record.isStudent,
    REVIEWER_ROLE: record.isReviewer,
    ADMIN_ROLE: record.isAdmin,
  }[roleName]

  const roleBytes = roleMap[roleName]
  const actionName = currentState ? '撤销' : '分配'

  busyAddress.value = addr
  busyRole.value = roleName

  try {
    if (currentState) {
      await revokeRole(roleBytes, addr)
    } else {
      await grantRole(roleBytes, addr)
    }

    const roles = await getAccountRoles(addr)
    const index = roleList.value.findIndex((r) => r.address.toLowerCase() === addr.toLowerCase())
    if (index >= 0) {
      roleList.value[index] = {
        address: addr,
        isStudent: roles.isStudent,
        isReviewer: roles.isReviewer,
        isAdmin: roles.isAdmin,
      }
      roleList.value = [...roleList.value]
    }

    message.success(`${actionName} ${roleName} 成功`)
  } catch (error) {
    message.error(`${actionName}失败: ` + (error.message || error))
  } finally {
    busyAddress.value = null
    busyRole.value = null
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

const loadCurrentAccountRoles = async () => {
  if (!account.value) return
  try {
    const roles = await getAccountRoles(account.value)
    roleList.value = [{
      address: account.value,
      isStudent: roles.isStudent,
      isReviewer: roles.isReviewer,
      isAdmin: roles.isAdmin,
    }]
  } catch (error) {
    console.error('Failed to load current account roles:', error)
  }
}

onMounted(() => {
  loadTheses()
  setupEventListener()
  loadCurrentAccountRoles()
})
</script>

<style scoped>
.admin-view {
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  margin-bottom: 24px;
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

.admin-tabs {
  margin-top: 16px;
}

:deep(.ant-tabs-nav) {
  background: white;
  padding: 0 16px;
  border-radius: 8px 8px 0 0;
}

.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.thesis-table-section, .events-section, .role-manage-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.section-desc {
  font-size: 14px;
  color: #64748B;
  margin-bottom: 24px;
}

.address-text {
  font-size: 12px;
  background: #F1F5F9;
  padding: 2px 6px;
  border-radius: 4px;
}

.address-long {
  font-size: 12px;
  word-break: break-all;
  color: #0F172A;
}

.no-reviewer {
  color: #94A3B8;
}

.no-action {
  font-size: 14px;
  color: #94A3B8;
}

.event-log {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #E2DFD6;
}

.event-log-item {
  padding: 8px 0;
  border-bottom: 1px solid #F1F5F9;
  font-size: 14px;
}

.event-log-item:last-child {
  border-bottom: none;
}

.event-name {
  font-weight: 500;
  color: #1E40AF;
  margin-right: 8px;
}

.event-value {
  color: #334155;
  margin-right: 8px;
}

.event-time {
  float: right;
  color: #94A3B8;
  font-size: 12px;
}

.role-form {
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #E2DFD6;
  margin-bottom: 16px;
}

:deep(.ant-form-item) {
  margin-bottom: 0;
}

.role-alert {
  margin-bottom: 24px;
}

.role-alert ul {
  padding-left: 20px;
  margin: 8px 0 0 0;
}

.role-alert li {
  margin-bottom: 4px;
  font-size: 14px;
  color: #475569;
}

.current-role {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #E2DFD6;
}

.current-role h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.current-role p {
  font-size: 14px;
  color: #475569;
  margin: 0;
}

.role-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  margin-left: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-admin {
  background: #DCFCE7;
  color: #166534;
}

.role-reviewer {
  background: #DBEAFE;
  color: #1E40AF;
}

.role-student {
  background: #FEF3C7;
  color: #92400E;
}

.role-none {
  background: #FEE2E2;
  color: #991B1B;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #F8FAFC !important;
}
</style>
