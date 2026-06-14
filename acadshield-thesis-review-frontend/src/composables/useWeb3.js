import { ref, shallowRef, computed } from 'vue'
import { ethers } from 'ethers'
import contractData from '../abi/AcadShield.json'

const STORAGE_KEY = 'acadshield_wallet_connected'

const provider = shallowRef(null)
const signer = shallowRef(null)
const account = ref(null)
const contract = shallowRef(null)
const isConnected = ref(false)
const userRole = ref(null)

const STUDENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes('STUDENT_ROLE'))
const REVIEWER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('REVIEWER_ROLE'))
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'))

export function useWeb3() {
  const connectWallet = async (ethereumProvider) => {
    const eth = ethereumProvider || window.ethereum
    if (!eth) {
      throw new Error('未检测到钱包，请安装 MetaMask 或其他钱包插件')
    }

    try {
      provider.value = new ethers.BrowserProvider(eth)
      // wallet_requestPermissions 强制弹出 MetaMask 账号选择框
      await provider.value.send('wallet_requestPermissions', [
        { eth_accounts: {} },
      ])
      signer.value = await provider.value.getSigner()
      account.value = await signer.value.getAddress()

      contract.value = new ethers.Contract(
        contractData.address,
        contractData.abi,
        signer.value
      )

      isConnected.value = true
      localStorage.setItem(STORAGE_KEY, 'true')
      listenAccountsChanged(eth)
      await detectRole()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }

  // 静默重连（不弹窗，页面刷新时调用）
  const reconnectWallet = async () => {
    const eth = window.ethereum
    if (!eth) return

    try {
      // eth_accounts 静默获取已授权的账号，不弹窗
      const accounts = await eth.request({ method: 'eth_accounts' })
      if (!accounts || accounts.length === 0) return

      provider.value = new ethers.BrowserProvider(eth)
      signer.value = await provider.value.getSigner()
      account.value = await signer.value.getAddress()

      contract.value = new ethers.Contract(
        contractData.address,
        contractData.abi,
        signer.value
      )

      isConnected.value = true
      listenAccountsChanged(eth)
      await detectRole()
    } catch (error) {
      console.error('Failed to reconnect:', error)
      clearConnection()
    }
  }

  const listenAccountsChanged = (eth) => {
    if (!eth?.on) return
    // 移除旧监听避免重复
    eth.removeListener('accountsChanged', handleAccountsChanged)
    eth.on('accountsChanged', handleAccountsChanged)
  }

  const handleAccountsChanged = (accounts) => {
    if (!accounts || accounts.length === 0) {
      disconnectWallet()
    } else {
      // 账号切换，重新连接
      reconnectWallet()
    }
  }

  const detectRole = async () => {
    if (!contract.value || !account.value) return

    try {
      const isAdmin = await contract.value.hasRole(ADMIN_ROLE, account.value)
      if (isAdmin) {
        userRole.value = 'ADMIN_ROLE'
        return
      }

      const isReviewer = await contract.value.hasRole(REVIEWER_ROLE, account.value)
      if (isReviewer) {
        userRole.value = 'REVIEWER_ROLE'
        return
      }

      const isStudent = await contract.value.hasRole(STUDENT_ROLE, account.value)
      if (isStudent) {
        userRole.value = 'STUDENT_ROLE'
        return
      }

      userRole.value = null
    } catch (error) {
      console.error('Failed to detect role:', error)
      userRole.value = null
    }
  }

  const clearConnection = () => {
    provider.value = null
    signer.value = null
    account.value = null
    contract.value = null
    isConnected.value = false
    userRole.value = null
  }

  const disconnectWallet = () => {
    clearConnection()
    localStorage.removeItem(STORAGE_KEY)
  }

  const submitThesis = async (thesisCID) => {
    if (!contract.value) throw new Error('Contract not initialized')
    const tx = await contract.value.submitThesis(thesisCID)
    return await tx.wait()
  }

  const reviewThesis = async (thesisId, score, reviewCID) => {
    if (!contract.value) throw new Error('Contract not initialized')
    const tx = await contract.value.reviewThesis(thesisId, score, reviewCID)
    return await tx.wait()
  }

  const finalizeGrade = async (thesisId) => {
    if (!contract.value) throw new Error('Contract not initialized')
    const tx = await contract.value.finalizeGrade(thesisId)
    return await tx.wait()
  }

  const rejectThesis = async (thesisId) => {
    if (!contract.value) throw new Error('Contract not initialized')
    const tx = await contract.value.rejectThesis(thesisId)
    return await tx.wait()
  }

  const getThesisDetails = async (thesisId) => {
    if (!contract.value) throw new Error('Contract not initialized')
    return await contract.value.getThesisDetails(thesisId)
  }

  const getStudentTheses = async (studentAddress) => {
    if (!contract.value) throw new Error('Contract not initialized')
    return await contract.value.getStudentTheses(studentAddress)
  }

  const getThesisCount = async () => {
    if (!contract.value) throw new Error('Contract not initialized')
    return await contract.value.getThesisCount()
  }

  const shortAddress = computed(() => {
    if (!account.value) return ''
    return `${account.value.slice(0, 6)}...${account.value.slice(-4)}`
  })

  return {
    provider,
    signer,
    account,
    contract,
    isConnected,
    userRole,
    shortAddress,
    connectWallet,
    reconnectWallet,
    disconnectWallet,
    submitThesis,
    reviewThesis,
    finalizeGrade,
    rejectThesis,
    getThesisDetails,
    getStudentTheses,
    getThesisCount,
  }
}
