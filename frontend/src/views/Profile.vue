<template>
  <div class="profile-page">
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <el-button text @click="$router.push('/')">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
          <h2 class="title">个人中心</h2>
        </div>
        <div class="header-right">
          <span class="username">{{ userStore.userInfo?.username }}</span>
          <el-button type="danger" text @click="handleLogout">退出登录</el-button>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="profile-container">
        <aside class="sidebar">
          <div class="user-card">
            <el-avatar :size="64" :src="userStore.userInfo?.avatar">
              {{ userStore.userInfo?.username?.charAt(0) }}
            </el-avatar>
            <div class="user-info">
              <div class="user-name">{{ userStore.userInfo?.username }}</div>
              <div class="user-email">{{ userStore.userInfo?.email }}</div>
            </div>
          </div>

          <el-menu
            :default-active="activeTab"
            class="profile-menu"
            @select="handleMenuSelect"
          >
            <el-menu-item index="stats">
              <el-icon><DataAnalysis /></el-icon>
              <span>数据统计</span>
            </el-menu-item>
            <el-menu-item index="banks">
              <el-icon><Collection /></el-icon>
              <span>我的题库</span>
            </el-menu-item>
            <el-menu-item index="wrong">
              <el-icon><Notebook /></el-icon>
              <span>错题本</span>
            </el-menu-item>
            <el-menu-item index="history">
              <el-icon><History /></el-icon>
              <span>刷题记录</span>
            </el-menu-item>
            <el-menu-item index="settings">
              <el-icon><Setting /></el-icon>
              <span>账号设置</span>
            </el-menu-item>
          </el-menu>
        </aside>

        <div class="content">
          <div v-if="activeTab === 'stats'" class="stats-section">
            <h3>学习数据统计</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon icon-1">
                  <el-icon size="28"><Document /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats.totalBanks }}</div>
                  <div class="stat-label">题库总数</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon icon-2">
                  <el-icon size="28"><EditPen /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats.totalQuestions }}</div>
                  <div class="stat-label">题目总数</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon icon-3">
                  <el-icon size="28"><Warning /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats.totalWrongQuestions }}</div>
                  <div class="stat-label">错题数量</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon icon-4">
                  <el-icon size="28"><Trophy /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats.totalPractices }}</div>
                  <div class="stat-label">刷题次数</div>
                </div>
              </div>
            </div>

            <div class="accuracy-card">
              <div class="accuracy-header">
                <h4>总体正确率</h4>
                <span class="accuracy-percent" :class="accuracyClass">{{ stats.accuracy }}%</span>
              </div>
              <el-progress :percentage="stats.accuracy" :color="accuracyColor" :stroke-width="16" />
              <div class="accuracy-detail">
                <span>答对 {{ stats.totalCorrect }} 题</span>
                <span>答错 {{ stats.totalWrong }} 题</span>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'banks'" class="banks-section">
            <div class="section-header">
              <h3>我的题库</h3>
              <el-button type="primary" @click="$router.push('/upload')">
                <el-icon><Plus /></el-icon>
                上传新题库
              </el-button>
            </div>

            <div v-loading="banksLoading" class="banks-grid">
              <div
                v-for="bank in bankList"
                :key="bank.id"
                class="bank-card"
              >
                <div class="bank-header">
                  <div class="bank-icon">
                    <el-icon size="32"><Document /></el-icon>
                  </div>
                  <el-dropdown @command="(cmd) => handleBankAction(cmd, bank)">
                    <el-button text>
                      <el-icon><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="practice-sequential">顺序刷题</el-dropdown-item>
                        <el-dropdown-item command="practice-random">随机刷题</el-dropdown-item>
                        <el-dropdown-item command="view">查看详情</el-dropdown-item>
                        <el-dropdown-item command="delete" divided>删除题库</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <h4 class="bank-title">{{ bank.title }}</h4>
                <div class="bank-meta">
                  <span><el-icon><QuestionFilled /></el-icon> {{ bank.total_questions }} 题</span>
                </div>
                <div class="bank-date">
                  {{ formatDate(bank.created_at) }}
                </div>
              </div>
            </div>

            <el-pagination
              v-if="banksTotal > 0"
              class="pagination"
              v-model:current-page="banksPage"
              v-model:page-size="banksPageSize"
              :total="banksTotal"
              layout="prev, pager, next, total"
              @current-change="loadBanks"
            />
          </div>

          <div v-else-if="activeTab === 'wrong'" class="wrong-section">
            <div class="section-header">
              <h3>错题本</h3>
            </div>

            <div v-loading="wrongLoading" class="wrong-list">
              <div
                v-for="item in wrongList"
                :key="item.question_id"
                class="wrong-card"
              >
                <div class="wrong-header">
                  <el-tag :type="getTypeTagType(item.type)" size="small">
                    {{ getTypeName(item.type) }}
                  </el-tag>
                  <span class="wrong-bank">来自：{{ item.bank_title }}</span>
                  <span class="wrong-count">错误 {{ item.wrong_count }} 次</span>
                </div>
                <div class="wrong-stem">{{ item.stem }}</div>
                <div class="wrong-footer">
                  <el-button type="primary" link @click="handleViewWrong(item)">
                    查看答案
                  </el-button>
                  <el-button type="danger" link @click="handleRemoveWrong(item.question_id)">
                    移除错题
                  </el-button>
                </div>
              </div>
            </div>

            <el-pagination
              v-if="wrongTotal > 0"
              class="pagination"
              v-model:current-page="wrongPage"
              v-model:page-size="wrongPageSize"
              :total="wrongTotal"
              layout="prev, pager, next, total"
              @current-change="loadWrongQuestions"
            />
          </div>

          <div v-else-if="activeTab === 'history'" class="history-section">
            <div class="section-header">
              <h3>刷题记录</h3>
            </div>

            <div v-loading="historyLoading" class="history-list">
              <div
                v-for="record in historyList"
                :key="record.id"
                class="history-card"
              >
                <div class="history-header">
                  <h4>{{ record.bank_title }}</h4>
                  <el-tag :type="record.mode === 'sequential' ? '' : 'success'" size="small">
                    {{ record.mode === 'sequential' ? '顺序刷题' : '随机刷题' }}
                  </el-tag>
                </div>
                <div class="history-stats">
                  <div class="history-stat">
                    <span class="label">已做</span>
                    <span class="value">{{ record.total_answered }}/{{ record.total_answered + 0 }}</span>
                  </div>
                  <div class="history-stat">
                    <span class="label">正确</span>
                    <span class="value success">{{ record.correct_count }}</span>
                  </div>
                  <div class="history-stat">
                    <span class="label">错误</span>
                    <span class="value danger">{{ record.wrong_count }}</span>
                  </div>
                  <div class="history-stat">
                    <span class="label">正确率</span>
                    <span class="value" :class="getAccuracyClass(record)">
                      {{ getAccuracy(record) }}%
                    </span>
                  </div>
                </div>
                <div class="history-time">{{ formatDate(record.started_at) }}</div>
              </div>
            </div>

            <el-pagination
              v-if="historyTotal > 0"
              class="pagination"
              v-model:current-page="historyPage"
              v-model:page-size="historyPageSize"
              :total="historyTotal"
              layout="prev, pager, next, total"
              @current-change="loadHistory"
            />
          </div>

          <div v-else-if="activeTab === 'settings'" class="settings-section">
            <h3>账号设置</h3>
            
            <div class="settings-card">
              <h4>基本信息</h4>
              <el-form :model="profileForm" label-width="100px" style="max-width: 400px">
                <el-form-item label="用户名">
                  <el-input v-model="profileForm.username" />
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input v-model="profileForm.email" disabled />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="profileLoading" @click="handleUpdateProfile">
                    保存修改
                  </el-button>
                </el-form-item>
              </el-form>
            </div>

            <div class="settings-card">
              <h4>修改密码</h4>
              <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px" style="max-width: 400px">
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input v-model="passwordForm.oldPassword" type="password" show-password />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="passwordForm.newPassword" type="password" show-password />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="passwordLoading" @click="handleUpdatePassword">
                    修改密码
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getUserStats, getPracticeHistory, updatePassword, updateProfile } from '@/api/user'
import { getBankList, deleteBank } from '@/api/bank'
import { getWrongQuestions, removeWrongQuestion, startPractice } from '@/api/practice'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('stats')

const stats = ref({
  totalBanks: 0,
  totalQuestions: 0,
  totalWrongQuestions: 0,
  totalPractices: 0,
  totalCorrect: 0,
  totalWrong: 0,
  accuracy: 0
})

const accuracyClass = computed(() => {
  if (stats.value.accuracy >= 80) return 'text-success'
  if (stats.value.accuracy >= 60) return 'text-warning'
  return 'text-danger'
})

const accuracyColor = computed(() => {
  if (stats.value.accuracy >= 80) return '#67c23a'
  if (stats.value.accuracy >= 60) return '#e6a23c'
  return '#f56c6c'
})

const banksLoading = ref(false)
const bankList = ref([])
const banksPage = ref(1)
const banksPageSize = ref(8)
const banksTotal = ref(0)

const wrongLoading = ref(false)
const wrongList = ref([])
const wrongPage = ref(1)
const wrongPageSize = ref(10)
const wrongTotal = ref(0)

const historyLoading = ref(false)
const historyList = ref([])
const historyPage = ref(1)
const historyPageSize = ref(10)
const historyTotal = ref(0)

const profileForm = ref({
  username: '',
  email: ''
})
const profileLoading = ref(false)

const passwordFormRef = ref(null)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordLoading = ref(false)

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleMenuSelect = (index) => {
  activeTab.value = index
  if (index === 'stats') loadStats()
  if (index === 'banks') loadBanks()
  if (index === 'wrong') loadWrongQuestions()
  if (index === 'history') loadHistory()
}

const loadStats = async () => {
  try {
    const res = await getUserStats()
    stats.value = res.data
  } catch (err) {
    ElMessage.error('加载统计数据失败')
  }
}

const loadBanks = async () => {
  banksLoading.value = true
  try {
    const res = await getBankList({ page: banksPage.value, pageSize: banksPageSize.value })
    bankList.value = res.data.list
    banksTotal.value = res.data.total
  } catch (err) {
    ElMessage.error('加载题库列表失败')
  } finally {
    banksLoading.value = false
  }
}

const loadWrongQuestions = async () => {
  wrongLoading.value = true
  try {
    const res = await getWrongQuestions({ page: wrongPage.value, pageSize: wrongPageSize.value })
    wrongList.value = res.data.list
    wrongTotal.value = res.data.total
  } catch (err) {
    ElMessage.error('加载错题列表失败')
  } finally {
    wrongLoading.value = false
  }
}

const loadHistory = async () => {
  historyLoading.value = true
  try {
    const res = await getPracticeHistory({ page: historyPage.value, pageSize: historyPageSize.value })
    historyList.value = res.data.list
    historyTotal.value = res.data.total
  } catch (err) {
    ElMessage.error('加载历史记录失败')
  } finally {
    historyLoading.value = false
  }
}

const handleBankAction = async (cmd, bank) => {
  switch (cmd) {
    case 'practice-sequential':
      sessionStorage.setItem('practice_mode', 'sequential')
      router.push(`/practice/${bank.id}`)
      break
    case 'practice-random':
      sessionStorage.setItem('practice_mode', 'random')
      router.push(`/practice/${bank.id}`)
      break
    case 'view':
      ElMessage.info('查看详情功能开发中')
      break
    case 'delete':
      ElMessageBox.confirm(`确定要删除题库"${bank.title}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteBank(bank.id)
          ElMessage.success('删除成功')
          loadBanks()
          loadStats()
        } catch (err) {
          ElMessage.error('删除失败')
        }
      }).catch(() => {})
      break
  }
}

const handleViewWrong = (item) => {
  ElMessageBox.alert(
    `
      <p style="margin-bottom: 12px;"><strong>正确答案：</strong>${item.answer}</p>
      ${item.analysis ? `<p><strong>解析：</strong>${item.analysis}</p>` : ''}
    `,
    '答案与解析',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '我知道了'
    }
  )
}

const handleRemoveWrong = async (questionId) => {
  ElMessageBox.confirm('确定要从错题本移除这道题吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await removeWrongQuestion(questionId)
      ElMessage.success('已移除')
      loadWrongQuestions()
      loadStats()
    } catch (err) {
      ElMessage.error('移除失败')
    }
  }).catch(() => {})
}

const handleUpdateProfile = async () => {
  if (!profileForm.value.username) {
    ElMessage.warning('用户名不能为空')
    return
  }
  
  profileLoading.value = true
  try {
    const res = await updateProfile({ username: profileForm.value.username })
    userStore.setUserInfo(res.data)
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error('保存失败')
  } finally {
    profileLoading.value = false
  }
}

const handleUpdatePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate()
  
  passwordLoading.value = true
  try {
    await updatePassword(passwordForm.value.oldPassword, passwordForm.value.newPassword)
    ElMessage.success('密码修改成功')
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (err) {
    ElMessage.error('修改失败')
  } finally {
    passwordLoading.value = false
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  }).catch(() => {})
}

const getTypeName = (type) => {
  const map = { single: '单选题', multiple: '多选题', judge: '判断题' }
  return map[type] || '单选题'
}

const getTypeTagType = (type) => {
  const map = { single: '', multiple: 'warning', judge: 'info' }
  return map[type] || ''
}

const getAccuracy = (record) => {
  const total = record.correct_count + record.wrong_count
  if (total === 0) return 0
  return Math.round((record.correct_count / total) * 100)
}

const getAccuracyClass = (record) => {
  const acc = getAccuracy(record)
  if (acc >= 80) return 'success'
  if (acc >= 60) return 'warning'
  return 'danger'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  profileForm.value.username = userStore.userInfo?.username || ''
  profileForm.value.email = userStore.userInfo?.email || ''
  loadStats()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  color: #606266;
}

.main {
  flex: 1;
  padding: 24px;
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
}

.sidebar {
  background: white;
  border-radius: 12px;
  padding: 20px 0;
  height: fit-content;
}

.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px 20px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 12px;
}

.user-info {
  text-align: center;
  margin-top: 12px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.user-email {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.profile-menu {
  border-right: none;
}

.content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  min-height: 600px;
}

.content h3 {
  margin: 0 0 24px 0;
  color: #303133;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h3 {
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.icon-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.icon-2 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.icon-3 {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.icon-4 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.accuracy-card {
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
}

.accuracy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.accuracy-header h4 {
  margin: 0;
  color: #303133;
}

.accuracy-percent {
  font-size: 24px;
  font-weight: 700;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.accuracy-detail {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 14px;
  color: #606266;
}

.banks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.bank-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.bank-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.bank-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.bank-icon {
  color: #409eff;
}

.bank-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bank-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.bank-date {
  font-size: 12px;
  color: #c0c4cc;
}

.wrong-list,
.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wrong-card,
.history-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 20px;
  transition: box-shadow 0.3s ease;
}

.wrong-card:hover,
.history-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.wrong-header,
.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.wrong-bank {
  color: #909399;
  font-size: 14px;
}

.wrong-count {
  margin-left: auto;
  color: #f56c6c;
  font-size: 14px;
}

.wrong-stem {
  color: #303133;
  line-height: 1.8;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wrong-footer {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f5f7fa;
}

.history-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 12px;
}

.history-stat {
  text-align: center;
}

.history-stat .label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.history-stat .value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.history-stat .value.success {
  color: #67c23a;
}

.history-stat .value.danger {
  color: #f56c6c;
}

.history-stat .value.warning {
  color: #e6a23c;
}

.history-time {
  font-size: 12px;
  color: #c0c4cc;
}

.settings-card {
  margin-bottom: 32px;
}

.settings-card h4 {
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  color: #303133;
}

.pagination {
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 1024px) {
  .profile-container {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
