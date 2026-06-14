<template>
  <span :class="badgeClass">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  state: {
    type: Number,
    required: true,
  },
})

const badgeClass = computed(() => {
  switch (props.state) {
    case 1: return 'status-badge status-submitted'
    case 2: return 'status-badge status-under-review'
    case 3: return 'status-badge status-finalized'
    case 4: return 'status-badge status-rejected'
    default: return 'status-badge'
  }
})

const label = computed(() => {
  switch (props.state) {
    case 1: return '已提交'
    case 2: return '评审中'
    case 3: return '已定稿'
    case 4: return '已驳回'
    default: return '未知状态'
  }
})
</script>
