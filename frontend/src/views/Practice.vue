<template>
  <div class="practice-page">
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <el-button text @click="$router.push('/upload')">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h2 class="bank-title">{{ bankTitle }}</h2>
        </div>
        <div class="header-right">
          <el-tag :type="mode === 'sequential' ? '' : 'success'" size="small">
            {{ mode === 'sequential' ? '顺序刷题' : '随机刷题' }}
          </el-tag>
          <el-button type="danger" text @click="handleEndPractice">
            结束刷题
          </el-button>
        </div>
      </div>
    </header>

    <main class="main">
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading" size="48"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <div v-else-if="currentQuestion" class="practice-container">
        <div class="practice-sidebar">
          <div class="progress-card">
            <div class="progress-item">
              <span class="label">已做题数</span>
              <span class="value">{{ answeredCount }}</span>
            </div>
            <div class="progress-item">
              <span class="label">剩余题数</span>
              <span class="value">{{ totalQuestions - answeredCount }}</span>
            </div>
            <div class="progress-item">
              <span class="label">正确率</span>
              <span class="value" :class="accuracyClass">{{ accuracy }}%</span>
            </div>
          </div>

          <div class="question-nav">
            <div class="nav-title">题目导航</div>
            <div class="nav-grid">
              <div
                v-for="(qid, index) in questionIds"
                :key="qid"
                class="nav-item"
                :class="getNavItemClass(qid, index)"
                @click="goToQuestion(index)"
              >
                {{ index + 1 }}
              </div>
            </div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <span class="dot current"></span>
              <span>当前题</span>
            </div>
            <div class="legend-item">
              <span class="dot correct"></span>
              <span>答对</span>
            </div>
            <div class="legend-item">
              <span class="dot wrong"></span>
              <span>答错</span>
            </div>
            <div class="legend-item">
              <span class="dot marked"></span>
              <span>标记</span>
            </div>
          </div>
        </div>

        <div class="question-area">
          <div class="question-card">
            <div class="question-header">
              <span class="question-number">第 {{ currentIndex + 1 }} / {{ totalQuestions }} 题</span>
              <el-tag :type="getTypeTagType(currentQuestion.type)" size="small">
                {{ getTypeName(currentQuestion.type) }}
              </el-tag>
            </div>

            <div class="question-stem">{{ currentQuestion.stem }}</div>

            <div class="question-options">
              <div
                v-for="(option, optIndex) in currentQuestion.options"
                :key="optIndex"
                class="option-item"
                :class="getOptionClass(optIndex)"
                @click="selectOption(optIndex)"
              >
                <span class="option-label">{{ getOptionLabel(optIndex) }}</span>
                <span class="option-text">{{ getOptionText(option) }}</span>
              </div>
            </div>

            <div v-if="showAnalysis" class="analysis-section">
              <el-alert
                :title="isCurrentCorrect ? '回答正确！' : '回答错误'"
                :type="isCurrentCorrect ? 'success' : 'error'"
                :closable="false"
                show-icon
              >
                <div class="analysis-content">
                  <p><strong>正确答案：</strong>{{ currentQuestion.answer }}</p>
                  <p v-if="currentQuestion.analysis">
                    <strong>解析：</strong>{{ currentQuestion.analysis }}
                  </p>
                </div>
              </el-alert>
            </div>

            <div class="question-actions">
              <el-button :disabled="currentIndex === 0" @click="prevQuestion">
                <el-icon><ArrowLeft /></el-icon>
                上一题
              </el-button>
              <el-checkbox v-model="isMarked" @change="handleMarkToggle">
                标记错题
              </el-checkbox>
              <el-button
                v-if="!hasAnswered"
                type="primary"
                :disabled="!selectedAnswer"
                @click="submitAnswer"
              >
                提交答案
              </el-button>
              <el-button
                v-else-if="currentIndex < totalQuestions - 1"
                type="primary"
                @click="nextQuestion"
              >
                下一题
                <el-icon><ArrowRight /></el-icon>
              </el-button>
              <el-button v-else type="success" @click="handleEndPractice">
                完成刷题
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <el-dialog v-model="resultDialogVisible" title="刷题结果" width="500px">
      <div class="result-content">
        <div class="result-stats">
          <div class="stat-item">
            <div class="stat-value primary">{{ totalQuestions }}</div>
            <div class="stat-label">总题数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value success">{{ correctCount }}</div>
            <div class="stat-label">答对</div>
          </div>
          <div class="stat-item">
            <div class="stat-value danger">{{ wrongCount }}</div>
            <div class="stat-label">答错</div>
          </div>
          <div class="stat-item">
            <div class="stat-value warning">{{ accuracy }}%</div>
            <div class="stat-label">正确率</div>
          </div>
        </div>
        <div class="result-chart">
          <el-progress
            type="dashboard"
            :percentage="accuracy"
            :color="accuracyColor"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="handlePracticeAgain">再练一次</el-button>
        <el-button type="primary" @click="$router.push('/upload')">返回上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBankDetail } from '@/api/bank'
import { startPractice, submitAnswer as apiSubmitAnswer, endPractice } from '@/api/practice'
import { useUserStore } from '@/stores/user'
import { useGuestStore } from '@/stores/guest'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const guestStore = useGuestStore()

const loading = ref(true)
const bankId = ref('')
const bankTitle = ref('')
const mode = ref('sequential')
const totalQuestions = ref(0)
const questionIds = ref([])
const questions = ref({})
const currentIndex = ref(0)
const selectedAnswer = ref('')
const showAnalysis = ref(false)
const isMarked = ref(false)
const resultDialogVisible = ref(false)
const recordId = ref(null)
const answers = ref({})

const currentQuestionId = computed(() => questionIds.value[currentIndex.value])
const currentQuestion = computed(() => questions.value[currentQuestionId.value])
const hasAnswered = computed(() => !!answers.value[currentQuestionId.value])
const isCurrentCorrect = computed(() => answers.value[currentQuestionId.value]?.isCorrect)

const answeredCount = computed(() => Object.keys(answers.value).length)
const correctCount = computed(() => Object.values(answers.value).filter(a => a.isCorrect).length)
const wrongCount = computed(() => answeredCount.value - correctCount.value)
const accuracy = computed(() => {
  if (answeredCount.value === 0) return 0
  return Math.round((correctCount.value / answeredCount.value) * 100)
})

const accuracyClass = computed(() => {
  if (accuracy.value >= 80) return 'text-success'
  if (accuracy.value >= 60) return 'text-warning'
  return 'text-danger'
})

const accuracyColor = computed(() => {
  if (accuracy.value >= 80) return '#67c23a'
  if (accuracy.value >= 60) return '#e6a23c'
  return '#f56c6c'
})

const getTypeName = (type) => {
  const map = { single: '单选题', multiple: '多选题', judge: '判断题' }
  return map[type] || '单选题'
}

const getTypeTagType = (type) => {
  const map = { single: '', multiple: 'warning', judge: 'info' }
  return map[type] || ''
}

const getOptionLabel = (index) => {
  if (currentQuestion.value?.type === 'judge') {
    return index === 0 ? '正确' : '错误'
  }
  return String.fromCharCode(65 + index)
}

const getOptionText = (option) => {
  if (currentQuestion.value?.type === 'judge') {
    return option
  }
  return option.replace(/^[A-Z][.、]\s*/, '')
}

const getOptionClass = (optIndex) => {
  const label = getOptionLabel(optIndex)
  const selected = selectedAnswer.value === label
  const answered = hasAnswered.value
  
  if (!answered) {
    return { selected }
  }
  
  const correctAnswer = currentQuestion.value?.answer || ''
  const isCorrectOption = correctAnswer.includes(label)
  const isSelected = selectedAnswer.value === label
  
  return {
    correct: isCorrectOption,
    wrong: isSelected && !isCorrectOption,
    selected: isSelected
  }
}

const getNavItemClass = (qid, index) => {
  const isCurrent = index === currentIndex.value
  const answer = answers.value[qid]
  const isMarked = answer?.isMarked
  
  return {
    current: isCurrent,
    correct: answer?.isCorrect,
    wrong: answer && !answer.isCorrect,
    marked: isMarked
  }
}

const selectOption = (optIndex) => {
  if (hasAnswered.value) return
  
  const label = getOptionLabel(optIndex)
  
  if (currentQuestion.value?.type === 'multiple') {
    let selected = selectedAnswer.value ? selectedAnswer.value.split(',') : []
    if (selected.includes(label)) {
      selected = selected.filter(s => s !== label)
    } else {
      selected.push(label)
    }
    selected.sort()
    selectedAnswer.value = selected.join(',')
  } else {
    selectedAnswer.value = label
  }
}

const goToQuestion = (index) => {
  currentIndex.value = index
  const answer = answers.value[questionIds.value[index]]
  if (answer) {
    selectedAnswer.value = answer.userAnswer
    showAnalysis.value = true
    isMarked.value = answer.isMarked
  } else {
    selectedAnswer.value = ''
    showAnalysis.value = false
    isMarked.value = false
  }
}

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    goToQuestion(currentIndex.value - 1)
  }
}

const nextQuestion = () => {
  if (currentIndex.value < totalQuestions.value - 1) {
    goToQuestion(currentIndex.value + 1)
  }
}

const submitAnswer = async () => {
  if (!selectedAnswer.value) return
  
  const qid = currentQuestionId.value
  
  try {
    let result
    if (userStore.isLoggedIn && recordId.value) {
      const res = await apiSubmitAnswer(recordId.value, qid, selectedAnswer.value, isMarked.value)
      result = res.data
    } else {
      const guestRecordId = route.query.recordId
      result = guestStore.submitAnswer(guestRecordId, qid, selectedAnswer.value, isMarked.value)
    }
    
    answers.value[qid] = {
      userAnswer: selectedAnswer.value,
      isCorrect: result.isCorrect,
      isMarked: isMarked.value
    }
    
    showAnalysis.value = true
  } catch (err) {
    ElMessage.error('提交失败')
  }
}

const handleMarkToggle = (val) => {
  const qid = currentQuestionId.value
  if (answers.value[qid]) {
    answers.value[qid].isMarked = val
  }
}

const handleEndPractice = () => {
  ElMessageBox.confirm('确定要结束本次刷题吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '继续刷题',
    type: 'warning'
  }).then(async () => {
    try {
      if (userStore.isLoggedIn && recordId.value) {
        await endPractice(recordId.value)
      } else {
        const guestRecordId = route.query.recordId
        if (guestRecordId) {
          guestStore.endPractice(guestRecordId)
        }
      }
      resultDialogVisible.value = true
    } catch (err) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

const handlePracticeAgain = () => {
  resultDialogVisible.value = false
  router.go(0)
}

onMounted(async () => {
  const bankIdParam = route.params.bankId
  bankId.value = bankIdParam
  
  if (userStore.isLoggedIn) {
    try {
      const savedMode = sessionStorage.getItem('practice_mode') || 'sequential'
      mode.value = savedMode
      
      const [bankRes, startRes] = await Promise.all([
        getBankDetail(bankIdParam),
        startPractice(bankIdParam, savedMode)
      ])
      
      bankTitle.value = bankRes.data.bank.title
      totalQuestions.value = bankRes.data.bank.total_questions
      
      bankRes.data.questions.forEach(q => {
        questions.value[q.id] = q
      })
      
      recordId.value = startRes.data.recordId
      questionIds.value = startRes.data.questionIds
      
      loading.value = false
    } catch (err) {
      ElMessage.error('加载失败')
      router.push('/upload')
    }
  } else {
    const guestRecordId = route.query.recordId
    if (guestRecordId) {
      const record = guestStore.getRecord(guestRecordId)
      const bank = guestStore.getBank(record?.bankId)
      
      if (record && bank) {
        bankTitle.value = bank.title
        mode.value = record.mode
        totalQuestions.value = bank.totalQuestions
        questionIds.value = record.questionIds
        
        bank.questions.forEach(q => {
          questions.value[q.id] = q
        })
        
        Object.keys(record.answers).forEach(qid => {
          answers.value[qid] = record.answers[qid]
        })
        
        loading.value = false
      } else {
        ElMessage.error('未找到刷题记录')
        router.push('/upload')
      }
    } else {
      ElMessage.error('参数错误')
      router.push('/upload')
    }
  }
})
</script>

<style scoped>
.practice-page {
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
  max-width: 1400px;
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

.bank-title {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.main {
  flex: 1;
  padding: 24px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #909399;
  gap: 16px;
}

.practice-container {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
}

.practice-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-item .label {
  color: #909399;
  font-size: 14px;
}

.progress-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.text-success {
  color: #67c23a !important;
}

.text-warning {
  color: #e6a23c !important;
}

.text-danger {
  color: #f56c6c !important;
}

.question-nav {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.nav-title {
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.nav-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #f5f7fa;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background: #ecf5ff;
  color: #409eff;
}

.nav-item.current {
  background: #409eff;
  color: white;
}

.nav-item.correct {
  background: #f0f9eb;
  color: #67c23a;
}

.nav-item.correct.current {
  background: #67c23a;
  color: white;
}

.nav-item.wrong {
  background: #fef0f0;
  color: #f56c6c;
}

.nav-item.wrong.current {
  background: #f56c6c;
  color: white;
}

.nav-item.marked::after {
  content: '';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e6a23c;
}

.legend {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #606266;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.dot.current {
  background: #409eff;
}

.dot.correct {
  background: #67c23a;
}

.dot.wrong {
  background: #f56c6c;
}

.dot.marked {
  background: #e6a23c;
  border-radius: 50%;
}

.question-area {
  min-height: 500px;
}

.question-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.question-number {
  font-weight: 600;
  color: #409eff;
}

.question-stem {
  font-size: 18px;
  line-height: 2;
  margin-bottom: 24px;
  color: #303133;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border: 2px solid #ebeef5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-item:hover {
  border-color: #409eff;
  background: #f5faff;
}

.option-item.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.option-item.correct {
  border-color: #67c23a;
  background: #f0f9eb;
}

.option-item.wrong {
  border-color: #f56c6c;
  background: #fef0f0;
}

.option-label {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #606266;
}

.option-item.selected .option-label {
  background: #409eff;
  color: white;
}

.option-item.correct .option-label {
  background: #67c23a;
  color: white;
}

.option-item.wrong .option-label {
  background: #f56c6c;
  color: white;
}

.option-text {
  flex: 1;
  line-height: 28px;
  color: #303133;
}

.analysis-section {
  margin-bottom: 24px;
}

.analysis-content {
  margin-top: 12px;
  line-height: 1.8;
}

.analysis-content p {
  margin: 8px 0;
}

.question-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

.result-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 20px 0;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  width: 100%;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-value.primary {
  color: #409eff;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.danger {
  color: #f56c6c;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

@media (max-width: 1024px) {
  .practice-container {
    grid-template-columns: 1fr;
  }

  .practice-sidebar {
    order: 2;
  }
}
</style>
