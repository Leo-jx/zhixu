<template>
  <div class="home-page">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <el-icon><Reading /></el-icon>
          <span class="logo-text">知序</span>
        </div>
        <div class="header-actions">
          <template v-if="userStore.isLoggedIn">
            <el-button type="text" @click="$router.push('/profile')">
              {{ userStore.userInfo?.username }}
            </el-button>
            <el-button type="text" @click="handleLogout">退出登录</el-button>
          </template>
          <template v-else>
            <el-button type="text" @click="showAuthDialog = true; authMode = 'login'">登录</el-button>
            <el-button type="primary" @click="showAuthDialog = true; authMode = 'register'">注册</el-button>
          </template>
        </div>
      </div>
    </header>

    <main class="main">
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">AI 智能拆题，高效刷题</h1>
          <p class="hero-desc">
            上传 Word 习题文档，AI 自动识别题目结构，一键生成在线题库。
            支持顺序刷题、随机刷题、错题本等多种学习模式。
          </p>
          <div class="hero-buttons">
            <el-button type="primary" size="large" @click="handleStartUse">
              立即开始
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
            <el-button size="large" @click="scrollToFeatures">
              了解更多
            </el-button>
          </div>
          <div class="guest-tip" v-if="!userStore.isLoggedIn">
            <el-icon><InfoFilled /></el-icon>
            <span>游客也可免费体验，数据仅保存在当前会话</span>
          </div>
        </div>
        <div class="hero-illustration">
          <div class="illustration-card card-1">
            <el-icon size="48"><Document /></el-icon>
            <p>上传 Word 文档</p>
          </div>
          <div class="illustration-card card-2">
            <el-icon size="48"><MagicStick /></el-icon>
            <p>AI 智能拆题</p>
          </div>
          <div class="illustration-card card-3">
            <el-icon size="48"><Edit /></el-icon>
            <p>在线刷题</p>
          </div>
        </div>
      </section>

      <section class="features-section" id="features">
        <h2 class="section-title">核心功能</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon icon-1">
              <el-icon size="32"><Upload /></el-icon>
            </div>
            <h3>Word 智能解析</h3>
            <p>支持 .doc/.docx 格式，AI 自动识别题干、选项、答案、解析，自适应各种排版格式</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon icon-2">
              <el-icon size="32"><Operation /></el-icon>
            </div>
            <h3>双模式刷题</h3>
            <p>顺序刷题按原文档顺序，随机刷题打乱顺序，灵活切换，巩固记忆</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon icon-3">
              <el-icon size="32"><Notebook /></el-icon>
            </div>
            <h3>错题本管理</h3>
            <p>自动收集错题，支持标记重点，反复练习薄弱环节，高效提升</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon icon-4">
              <el-icon size="32"><DataAnalysis /></el-icon>
            </div>
            <h3>学习统计</h3>
            <p>实时显示正确率、做题进度，云端保存学习记录，随时查看历史数据</p>
          </div>
        </div>
      </section>

      <section class="cta-section">
        <div class="cta-content">
          <h2>准备好提升学习效率了吗？</h2>
          <p>立即上传你的第一份习题文档，开始智能刷题之旅</p>
          <el-button type="primary" size="large" @click="handleStartUse">
            {{ userStore.isLoggedIn ? '上传文档' : '免费体验' }}
          </el-button>
        </div>
      </section>
    </main>

    <footer class="footer">
      <p>© 2024 知序 - AI 智能刷题平台</p>
    </footer>

    <AuthDialog v-model="showAuthDialog" :default-mode="authMode" @success="handleAuthSuccess" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import AuthDialog from '@/components/AuthDialog.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const showAuthDialog = ref(false)
const authMode = ref('login')

const handleStartUse = () => {
  router.push('/upload')
}

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    ElMessage.success('已退出登录')
  }).catch(() => {})
}

const handleAuthSuccess = () => {
  const redirect = route.query.redirect
  if (redirect) {
    router.push(redirect)
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.logo-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.main {
  flex: 1;
}

.hero-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 18px;
  color: #606266;
  line-height: 1.8;
  margin-bottom: 40px;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.guest-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 14px;
}

.hero-illustration {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.illustration-card {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.illustration-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.illustration-card p {
  margin-top: 12px;
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.card-1 {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  color: #409eff;
}

.card-2 {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  color: #67c23a;
}

.card-3 {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  color: #e6a23c;
}

.features-section {
  background: #f8fafc;
  padding: 80px 24px;
}

.section-title {
  text-align: center;
  font-size: 36px;
  font-weight: 600;
  margin-bottom: 60px;
  color: #303133;
}

.features-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
}

.icon-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.icon-2 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.icon-3 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.icon-4 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.feature-card h3 {
  font-size: 20px;
  margin-bottom: 12px;
  color: #303133;
}

.feature-card p {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.cta-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 24px;
}

.cta-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  color: white;
}

.cta-content h2 {
  font-size: 36px;
  margin-bottom: 16px;
}

.cta-content p {
  font-size: 18px;
  margin-bottom: 32px;
  opacity: 0.9;
}

.footer {
  background: #1a1a2e;
  color: #909399;
  text-align: center;
  padding: 24px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .hero-section {
    grid-template-columns: 1fr;
    padding: 40px 24px;
  }

  .hero-title {
    font-size: 32px;
  }

  .hero-illustration {
    order: -1;
  }

  .features-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
