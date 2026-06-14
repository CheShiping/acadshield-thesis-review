import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import { ethers } from 'ethers'
import contractData from '../abi/AcadShield.json'

const STORAGE_KEY = 'acadshield_wallet_connected'
const EXPECTED_CHAIN_ID = 31337

export const useWalletStore = defineStore('wallet', () => {
  // --- State ---
  const provider = shallowRef(null)
  const signer = shallowRef(null)
  const account = ref(null)
  const contract = shallowRef(null)
  const isConnected = ref(false)
  const userRole = ref(null)
  const networkId = ref(null)

  const contractAddress = contractData.address

  const STUDENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes('STUDENT_ROLE'))
  const REVIEWER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('REVIEWER_ROLE'))
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'))

  // --- Getters ---
  const shortAddress = computed(() => {
    if (!account.value) return ''
    return `${account.value.slice(0, 6)}...${account.value.slice(-4)}`
  })

  // --- Internal helpers ---
  async function checkNetwork(providerInstance) {
    try {
      const network = await providerInstance.getNetwork()
      networkId.value = Number(network.chainId)
      return Number(network.chainId) === EXPECTED_CHAIN_ID
    } catch (error) {
      console.error('Failed to check network:', error)
      return false
    }
  }

  function listenAccountsChanged(eth) {
    if (!eth?.on) return
    eth.removeListener('accountsChanged', handleAccountsChanged)
    eth.on('accountsChanged', handleAccountsChanged)
  }

  function handleAccountsChanged(accounts) {
    if (!accounts || accounts.length === 0) {
      disconnectWallet()
    } else {
      reconnectWallet()
    }
  }

  function clearConnection() {
    provider.value = null
    signer.value = null
    account.value = null
    contract.value = null
    isConnected.value = false
    userRole.value = null
    networkId.value = null
  }

  async function detectRole() {
    if (!contract.value || !account.value) {
      userRole.value = null
      return
    }

    try {
      const [isAdmin, isReviewer, isStudent] = await Promise.all([
        contract.value.hasRole(ADMIN_ROLE, account.value),
        contract.value.hasRole(REVIEWER_ROLE, account.value),
        contract.value.hasRole(STUDENT_ROLE, account.value),
      ])

      if (isAdmin) {
        userRole.value = 'ADMIN_ROLE'
      } else if (isReviewer) {
        userRole.value = 'REVIEWER_ROLE'
      } else if (isStudent) {
        userRole.value = 'STUDENT_ROLE'
      } else {
        userRole.value = null
      }
    } catch (error) {
      console.error('Failed to detect role:', error)
      userRole.value = null
    }
  }

  // --- Actions ---
  async function connectWallet(ethereumProvider) {
    const eth = ethereumProvider || window.ethereum
    if (!eth) {
      throw new Error('未检测到钱包，请安装 MetaMask 或其他钱包插件')
    }

    try {
      provider.value = new ethers.BrowserProvider(eth)

      const isCorrectNetwork = await checkNetwork(provider.value)
      if (!isCorrectNetwork) {
        try {
          await eth.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ethers.toBeHex(EXPECTED_CHAIN_ID) }],
          })
        } catch (switchError) {
          throw new Error('请连接到本地 Hardhat 网络 (Chain ID: 31337)')
        }
      }

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
      clearConnection()
      throw error
    }
  }

  async function reconnectWallet() {
    const eth = window.ethereum
    if (!eth) return

    try {
      const accounts = await eth.request({ method: 'eth_accounts' })
      if (!accounts || accounts.length === 0) return

      provider.value = new ethers.BrowserProvider(eth)

      const isCorrectNetwork = await checkNetwork(provider.value)
      if (!isCorrectNetwork) {
        console.warn('Reconnecting to wrong network, skipping')
        return
      }

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

  function disconnectWallet() {
    clearConnection()
    localStorage.removeItem(STORAGE_KEY)
  }

  // --- Contract interactions ---
  async function submitThesis(thesisCID) {
    if (!contract.value) throw new Error('合约未初始化')
    const tx = await contract.value.submitThesis(thesisCID)
    const receipt = await tx.wait()
    await detectRole()
    return receipt
  }

  async function reviewThesis(thesisId, score, reviewCID) {
    if (!contract.value) throw new Error('合约未初始化')
    const tx = await contract.value.reviewThesis(thesisId, score, reviewCID)
    const receipt = await tx.wait()
    await detectRole()
    return receipt
  }

  async function finalizeGrade(thesisId) {
    if (!contract.value) throw new Error('合约未初始化')
    const tx = await contract.value.finalizeGrade(thesisId)
    const receipt = await tx.wait()
    await detectRole()
    return receipt
  }

  async function rejectThesis(thesisId) {
    if (!contract.value) throw new Error('合约未初始化')
    const tx = await contract.value.rejectThesis(thesisId)
    const receipt = await tx.wait()
    await detectRole()
    return receipt
  }

  async function getThesisDetails(thesisId) {
    if (!contract.value) throw new Error('合约未初始化')
    return await contract.value.getThesisDetails(thesisId)
  }

  async function getStudentTheses(studentAddress) {
    if (!contract.value) throw new Error('合约未初始化')
    return await contract.value.getStudentTheses(studentAddress)
  }

  async function getThesisCount() {
    if (!contract.value) throw new Error('合约未初始化')
    return await contract.value.getThesisCount()
  }

  async function hasRole(role, address) {
    if (!contract.value) throw new Error('合约未初始化')
    return await contract.value.hasRole(role, address)
  }

  async function grantRole(role, address) {
    if (!contract.value) throw new Error('合约未初始化')
    const tx = await contract.value.grantRole(role, address)
    return await tx.wait()
  }

  async function revokeRole(role, address) {
    if (!contract.value) throw new Error('合约未初始化')
    const tx = await contract.value.revokeRole(role, address)
    return await tx.wait()
  }

  async function getAccountRoles(address) {
    if (!contract.value) throw new Error('合约未初始化')
    return await contract.value.getAccountRoles(address)
  }

  return {
    // State
    provider,
    signer,
    account,
    contract,
    isConnected,
    userRole,
    networkId,
    contractAddress,
    // Constants
    STUDENT_ROLE,
    REVIEWER_ROLE,
    ADMIN_ROLE,
    // Getters
    shortAddress,
    // Actions
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
    hasRole,
    grantRole,
    revokeRole,
    getAccountRoles,
  }
})
