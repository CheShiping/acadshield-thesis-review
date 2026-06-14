import { ref, computed } from 'vue'
import { ethers } from 'ethers'
import contractData from '../abi/AcadShield.json'

const provider = ref(null)
const signer = ref(null)
const account = ref(null)
const contract = ref(null)
const isConnected = ref(false)
const userRole = ref(null)

const STUDENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes('STUDENT_ROLE'))
const REVIEWER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('REVIEWER_ROLE'))
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'))

export function useWeb3() {
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('Please install MetaMask')
    }

    try {
      provider.value = new ethers.BrowserProvider(window.ethereum)
      await provider.value.send('eth_requestAccounts', [])
      signer.value = await provider.value.getSigner()
      account.value = await signer.value.getAddress()

      contract.value = new ethers.Contract(
        contractData.address,
        contractData.abi,
        signer.value
      )

      isConnected.value = true
      await detectRole()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
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

  const disconnectWallet = () => {
    provider.value = null
    signer.value = null
    account.value = null
    contract.value = null
    isConnected.value = false
    userRole.value = null
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
