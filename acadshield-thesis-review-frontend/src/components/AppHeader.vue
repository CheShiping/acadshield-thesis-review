<template>
  <a-layout-header class="app-header">
    <div class="header-content">
      <div class="header-brand">
        <router-link to="/" class="brand-link">
          <span class="brand-icon">盾</span>
          <span class="brand-text">AcadShield</span>
        </router-link>
      </div>

      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="horizontal"
        :theme="'dark'"
        class="header-nav"
      >
        <a-menu-item key="home">
          <router-link to="/">首页</router-link>
        </a-menu-item>
        <a-menu-item key="student">
          <router-link to="/student">学生端</router-link>
        </a-menu-item>
        <a-menu-item key="reviewer">
          <router-link to="/reviewer">导师端</router-link>
        </a-menu-item>
        <a-menu-item key="admin">
          <router-link to="/admin">教务端</router-link>
        </a-menu-item>
      </a-menu>

      <div class="header-wallet">
        <a-space>
          <a-tag v-if="isConnected && userRole" :color="roleColor">
            {{ roleLabel }}
          </a-tag>
          <a-button
            v-if="!isConnected"
            type="primary"
            @click="walletModalOpen = true"
          >
            连接钱包
          </a-button>
          <a-dropdown v-else>
            <a-button>
              {{ shortAddress }}
              <DownOutlined />
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="disconnect" @click="handleDisconnect">
                  断开连接
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-space>
      </div>
    </div>
  </a-layout-header>

  <WalletModal
    :open="walletModalOpen"
    @close="walletModalOpen = false"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { DownOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useWeb3 } from '../composables/useWeb3'
import WalletModal from './WalletModal.vue'

const route = useRoute()
const { isConnected, userRole, shortAddress, disconnectWallet } = useWeb3()

const walletModalOpen = ref(false)
const selectedKeys = ref(['home'])

watch(
  () => route.path,
  (path) => {
    if (path === '/') selectedKeys.value = ['home']
    else if (path === '/student') selectedKeys.value = ['student']
    else if (path === '/reviewer') selectedKeys.value = ['reviewer']
    else if (path === '/admin') selectedKeys.value = ['admin']
  },
  { immediate: true }
)

const roleColor = computed(() => {
  switch (userRole.value) {
    case 'ADMIN_ROLE': return 'red'
    case 'REVIEWER_ROLE': return 'blue'
    case 'STUDENT_ROLE': return 'green'
    default: return 'default'
  }
})

const roleLabel = computed(() => {
  switch (userRole.value) {
    case 'ADMIN_ROLE': return '管理员'
    case 'REVIEWER_ROLE': return '导师'
    case 'STUDENT_ROLE': return '学生'
    default: return '未知角色'
  }
})

const handleDisconnect = () => {
  disconnectWallet()
  message.info('已断开连接')
}
</script>

<style scoped>
.app-header {
  background: #0F172A;
  padding: 0 48px;
  display: flex;
  align-items: center;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.header-brand {
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.brand-icon {
  font-family: 'Noto Serif SC', serif;
  font-size: 28px;
  font-weight: 700;
  color: #F5F1E8;
  line-height: 1;
}

.brand-text {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #F5F1E8;
  letter-spacing: 0.5px;
}

.header-nav {
  flex: 1;
  margin: 0 48px;
  background: transparent;
  border-bottom: none;
  line-height: 62px;
}

.header-nav :deep(.ant-menu-item) {
  color: #94A3B8;
}

.header-nav :deep(.ant-menu-item-selected) {
  color: #F5F1E8;
}

.header-nav :deep(.ant-menu-item:hover) {
  color: #F5F1E8;
}

.header-wallet {
  flex-shrink: 0;
}

:deep(.ant-btn-primary) {
  background: #1E3A8A;
  border-color: #1E3A8A;
}

:deep(.ant-btn-primary:hover) {
  background: #1E40AF;
  border-color: #1E40AF;
}
</style>
