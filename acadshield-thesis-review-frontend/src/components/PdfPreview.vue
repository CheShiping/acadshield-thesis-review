<template>
  <a-drawer
    :open="visible"
    :title="drawerTitle"
    placement="right"
    :width="720"
    :body-style="{ padding: 0 }"
    :header-style="{ padding: '12px 16px', borderBottom: '1px solid #E2DFD6' }"
    @close="handleClose"
  >
    <template #extra>
      <a-button v-if="hasPdf" size="small" @click="handleDownload">
        下载 PDF
      </a-button>
    </template>

    <div v-if="hasPdf" class="pdf-container">
      <embed
        :src="blobUrl"
        type="application/pdf"
        class="pdf-embed"
      />
    </div>

    <div v-else class="pdf-missing">
      <div class="missing-icon">📄</div>
      <h3>论文 PDF 未在本浏览器中找到</h3>
      <p class="missing-hint">
        该论文的 PDF 文件未存储在当前浏览器中。<br/>
        可能是学生在其他浏览器上传，或浏览器缓存已清除。
      </p>
      <a-upload
        :before-upload="handleImport"
        :show-upload-list="false"
        accept=".pdf"
      >
        <a-button type="primary">
          从本地导入 PDF 以预览
        </a-button>
      </a-upload>
      <p class="import-note">导入仅用于本地预览，不影响链上 CID 记录</p>
    </div>
  </a-drawer>
</template>

<script setup>
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { message } from 'ant-design-vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  thesisId: { type: [Number, String], required: true },
  cid: { type: String, default: '' },
})

const emit = defineEmits(['close', 'loaded'])

const hasPdf = ref(false)
const fileName = ref('')
const blobUrl = ref(null)
let rawDataUrl = null // 存储原始 data URL，用于关闭时释放

const drawerTitle = computed(() => {
  if (hasPdf.value) return `论文 #${props.thesisId} — ${fileName.value}`
  return `论文 #${props.thesisId}`
})

// 将 data URL 转为 Blob URL，避免中文乱码
const dataUrlToBlobUrl = (dataUrl) => {
  try {
    const [header, base64] = dataUrl.split(',')
    const mime = header.match(/:(.*?);/)[1]
    const binary = atob(base64)
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i)
    }
    const blob = new Blob([array], { type: mime })
    return URL.createObjectURL(blob)
  } catch (e) {
    console.error('Failed to convert data URL to blob URL:', e)
    return null
  }
}

const revokeBlobUrl = () => {
  if (blobUrl.value && blobUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl.value)
  }
  blobUrl.value = null
}

const loadPdf = () => {
  revokeBlobUrl()
  if (props.thesisId == null) return

  const key = `acadshield_pdf_${props.thesisId}`
  const nameKey = `acadshield_pdf_name_${props.thesisId}`
  const data = localStorage.getItem(key)

  if (data) {
    rawDataUrl = data
    blobUrl.value = dataUrlToBlobUrl(data)
    hasPdf.value = !!blobUrl.value
    fileName.value = localStorage.getItem(nameKey) || `论文_${props.thesisId}.pdf`
    emit('loaded', true)
  } else {
    rawDataUrl = null
    hasPdf.value = false
    fileName.value = ''
    emit('loaded', false)
  }
}

watch(
  () => [props.visible, props.thesisId],
  ([vis]) => {
    if (vis) {
      loadPdf()
    } else {
      revokeBlobUrl()
    }
  },
)

const handleClose = () => {
  revokeBlobUrl()
  emit('close')
}

onBeforeUnmount(() => {
  revokeBlobUrl()
})

const handleImport = (file) => {
  if (file.size > 4 * 1024 * 1024) {
    message.warning('文件过大（超过 4MB），可能无法存入浏览器缓存')
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const dataUrl = e.target.result
      const key = `acadshield_pdf_${props.thesisId}`
      const nameKey = `acadshield_pdf_name_${props.thesisId}`
      localStorage.setItem(key, dataUrl)
      localStorage.setItem(nameKey, file.name)
      rawDataUrl = dataUrl
      revokeBlobUrl()
      blobUrl.value = dataUrlToBlobUrl(dataUrl)
      hasPdf.value = true
      fileName.value = file.name
      message.success('PDF 导入成功')
      emit('loaded', true)
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        message.error('浏览器存储空间不足，请清除旧文件后重试')
      } else {
        message.error('导入失败: ' + err.message)
      }
    }
  }
  reader.readAsDataURL(file)
  return false
}

const handleDownload = () => {
  if (!rawDataUrl) return
  const a = document.createElement('a')
  a.href = rawDataUrl
  a.download = fileName.value || `论文_${props.thesisId}.pdf`
  a.click()
}
</script>

<style scoped>
.pdf-container {
  height: 100%;
}

.pdf-embed {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.pdf-missing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  text-align: center;
  padding: 60px 40px;
}

.missing-icon {
  font-size: 64px;
  opacity: 0.5;
}

.missing-hint {
  font-size: 14px;
  color: #64748B;
  line-height: 1.6;
  max-width: 360px;
}

.import-note {
  font-size: 12px;
  color: #94A3B8;
  margin-top: 8px;
}
</style>
