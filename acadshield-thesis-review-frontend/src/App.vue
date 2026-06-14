<template>
  <a-layout class="app-layout">
    <AppHeader />
    <a-layout-content class="app-content">
      <router-view />
    </a-layout-content>
    <a-layout-footer class="app-footer">
      <div class="footer-content">
        <span class="footer-brand">盾 AcadShield</span>
        <span class="footer-divider">|</span>
        <span>可信毕设评审系统</span>
        <span class="footer-divider">|</span>
        <span>基于区块链技术</span>
      </div>
    </a-layout-footer>
  </a-layout>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #F5F1E8;
  color: #0F172A;
}

.app-layout {
  min-height: 100vh;
  background: #F5F1E8;
}

.app-content {
  padding: 24px 48px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  background: #0F172A;
  color: #94A3B8;
  text-align: center;
  padding: 24px 0;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.footer-brand {
  font-family: 'Noto Serif SC', serif;
  font-weight: 600;
  color: #F5F1E8;
}

.footer-divider {
  color: #475569;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Noto Serif SC', serif;
  color: #0F172A;
}

.mono {
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
}

.section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #E2DFD6;
}

.section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #0F172A;
  font-family: 'Noto Serif SC', serif;
}

.card-dark {
  background: #0F172A;
  border-radius: 8px;
  padding: 24px;
  color: #F5F1E8;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  font-family: 'Noto Serif SC', serif;
  color: #F5F1E8;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #94A3B8;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-submitted {
  background: #DBEAFE;
  color: #1E40AF;
}

.status-under-review {
  background: #FEF3C7;
  color: #92400E;
}

.status-finalized {
  background: #DCFCE7;
  color: #166534;
}

.status-rejected {
  background: #FEE2E2;
  color: #991B1B;
}

.event-log {
  background: #0F172A;
  border-radius: 8px;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #94A3B8;
  max-height: 300px;
  overflow-y: auto;
}

.event-log-item {
  padding: 4px 0;
  border-bottom: 1px solid #1E293B;
}

.event-log-item:last-child {
  border-bottom: none;
}

.event-log-item .event-name {
  color: #60A5FA;
}

.event-log-item .event-value {
  color: #F5F1E8;
}

.event-log-item .event-time {
  color: #64748B;
  margin-left: 8px;
}
</style>
