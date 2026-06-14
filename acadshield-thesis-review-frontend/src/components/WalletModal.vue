<template>
  <a-modal
    :open="open"
    title="连接钱包"
    :footer="null"
    :width="400"
    @cancel="$emit('close')"
  >
    <div class="wallet-list">
      <div
        v-for="wallet in wallets"
        :key="wallet.name"
        class="wallet-item"
        :class="{ disabled: !wallet.installed, selected: selectedWallet === wallet.name }"
        @click="handleSelect(wallet)"
      >
        <div class="wallet-icon">{{ wallet.icon }}</div>
        <div class="wallet-info">
          <div class="wallet-name">{{ wallet.name }}</div>
          <div class="wallet-status">
            <span v-if="wallet.installed" class="status-installed">已检测到</span>
            <span v-else class="status-missing">未检测到</span>
          </div>
        </div>
        <div v-if="connecting && selectedWallet === wallet.name" class="wallet-loading">
          <a-spin size="small" />
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { useWalletStore } from '../stores/wallet'

defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const walletStore = useWalletStore()
const connecting = ref(false)
const selectedWallet = ref(null)

const detectWallets = () => {
  const eth = window.ethereum
  const providers = eth?.providers || []
  const list = []

  // MetaMask
  const mm = providers.find(p => p.isMetaMask) || (eth?.isMetaMask ? eth : null)
  list.push({
    name: 'MetaMask',
    icon: '🦊',
    installed: !!mm,
    provider: mm,
  })

  // OKX Wallet
  const okx = providers.find(p => p.isOkxWallet) || (eth?.isOkxWallet ? eth : null)
  list.push({
    name: 'OKX Wallet',
    icon: '⭕',
    installed: !!okx,
    provider: okx,
  })

  // Rabby
  const rabby = providers.find(p => p.isRabby) || (eth?.isRabby ? eth : null)
  list.push({
    name: 'Rabby',
    icon: '🐰',
    installed: !!rabby,
    provider: rabby,
  })

  // Coinbase Wallet
  const cb = providers.find(p => p.isCoinbaseWallet) || (eth?.isCoinbaseWallet ? eth : null)
  list.push({
    name: 'Coinbase Wallet',
    icon: '🔵',
    installed: !!cb,
    provider: cb,
  })

  // Fallback: if no multi-provider detected but window.ethereum exists
  if (list.every(w => !w.installed) && eth) {
    list[0].installed = true
    list[0].provider = eth
  }

  return list
}

const wallets = ref(detectWallets())

const handleSelect = async (item) => {
  if (!item.installed) {
    message.warning(`请先安装 ${item.name} 插件`)
    return
  }

  connecting.value = true
  selectedWallet.value = item.name

  try {
    await walletStore.connectWallet(item.provider)
    message.success('钱包连接成功')
    emit('close')
  } catch (error) {
    message.error('连接失败: ' + error.message)
  } finally {
    connecting.value = false
    selectedWallet.value = null
  }
}
</script>

<style scoped>
.wallet-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wallet-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #E2DFD6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.wallet-item:hover:not(.disabled) {
  border-color: #1E3A8A;
  background: #F8FAFC;
}

.wallet-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.wallet-icon {
  font-size: 32px;
  width: 40px;
  text-align: center;
}

.wallet-info {
  flex: 1;
}

.wallet-name {
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
}

.wallet-status {
  font-size: 12px;
  margin-top: 2px;
}

.status-installed {
  color: #16A34A;
}

.status-missing {
  color: #94A3B8;
}

.wallet-loading {
  flex-shrink: 0;
}
</style>
