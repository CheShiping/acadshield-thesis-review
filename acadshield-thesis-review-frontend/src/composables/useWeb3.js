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
const networkId = ref(null)

const STUDENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes('STUDENT_ROLE'))
const REVIEWER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('REVIEWER_ROLE'))
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'))

const EXPECTED_CHAIN_ID = 31337

export function useWeb3() {
  const checkNetwork = async (providerInstance) => {
    try {
      const network = await providerInstance.getNetwork()
      networkId.value = network.chainId
      return network.chainId === EXPECTED_CHAIN_ID
    } catch (error) {
      console.error('Failed to check network:', error)
      return false
    }
  }

  const connectWallet = async (ethereumProvider) => {
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

  const reconnectWallet = async () => {
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

  const listenAccountsChanged = (eth) => {
    if (!eth?.on) return
    eth.removeListener('accountsChanged', handleAccountsChanged)
    eth.on('accountsChanged', handleAccountsChanged)
  }

  const handleAccountsChanged = (accounts) => {
    if (!accounts || accounts.length === 0) {
      disconnectWallet()
    } else {
      reconnectWallet()
    }
  }

  const detectRole = async () => {
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

  const clearConnection = () => {
    provider.value = null
    signer.value = null
    account.value = null
    contract.value = null
    isConnected.value = false
    userRole.value = null
    networkId.value = null
  }

  const disconnectWallet = () => {
    clearConnection()
    localStorage.removeItem(STORAGE_KEY)
  }

  const submitThesis = async (thesisCID) => {
    if (!contract.value) throw new Error('合约未初始化')
    const tx = await contract.value.submitThesis(thesisCID)
    const receipt = await tx.wait()
    await detectRole()
    return receipt
  }

  const reviewThesis = async (thesisId, score, reviewCID) => {
    if (!contract.value) throw new Error('合约未初始化')
    const tx = await contract.value.reviewThesis(thesisId, score, reviewCID)
    const receipt = await tx.wait()
    await detectRole()
    return receipt
  }

  const finalizeGrade = async (thesisId) => {
    if (!contract.value) throw new Error('合约未初始化')
    const tx = await contract.value.finalizeGrade(thesisId)
    const receipt = await tx.wait()
    await detectRole()
    return receipt
  }

  const rejectThesis = async (thesisId) => {
    if (!contract.value) throw new Error('合约未初始化')
    const tx = await contract.value.rejectThesis(thesisId)
    const receipt = await tx.wait()
    await detectRole()
    return receipt
  }

  const getThesisDetails = async (thesisId) => {
    if (!contract.value) throw new Error('合约未初始化')
    return await contract.value.getThesisDetails(thesisId)
  }

  const getStudentTheses = async (studentAddress) => {
    if (!contract.value) throw new Error('合约未初始化')
    return await contract.value.getStudentTheses(studentAddress)
  }

  const getThesisCount = async () => {
    if (!contract.value) throw new Error('合约未初始化')
    return await contract.value.getThesisCount()
  }

  const hasRole = async (role, address) => {
    if (!contract.value) throw new Error('合约未初始化')
    return await contract.value.hasRole(role, address)
  }

  const grantRole = async (role, address) => {
    if (!contract.value) throw new Error('合约未初始化')
    const tx = await contract.value.grantRole(role, address)
    const receipt = await tx.wait()
    return receipt
  }

  const revokeRole = async (role, address) => {
    if (!contract.value) throw new Error('合约未初始化')
    const tx = await contract.value.revokeRole(role, address)
    const receipt = await tx.wait()
    return receipt
  }

  const getAccountRoles = async (address) => {
    if (!contract.value) throw new Error('合约未初始化')
    return await contract.value.getAccountRoles(address)
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
    networkId,
    shortAddress,
    STUDENT_ROLE,
    REVIEWER_ROLE,
    ADMIN_ROLE,
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
}
