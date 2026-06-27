<template>
  <div class="upload-page">
    <header class="header">
      <div class="header-content">
        <div class="logo" @click="$router.push('/')">
          <el-icon><Reading /></el-icon>
          <span class="logo-text">知序</span>
        </div>
        <div class="header-actions">
          <template v-if="userStore.isLoggedIn">
            <el-button type="text" @click="$router.push('/profile')">个人中心</el-button>
          </template>
          <template v-else>
            <el-button type="text" @click="showAuthDialog = true; authMode = 'login'">登录</el-button>
            <el-button type="primary" @click="showAuthDialog = true; authMode = 'register'">注册</el-button>
          </template>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="upload-container">
        <div v-if="!bankData" class="upload-area">
          <h2>上传 Word 习题文档</h2>
          <p class="upload-tip">支持 .doc、.docx 格式，AI 将自动识别题目结构</p>
          
          <el-upload
            class="upload-dragger"
            drag
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            accept=".doc,.docx"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持 .doc、.docx 格式文件，大小不超过 50MB
              </div>
            </template>
          </el-upload>

          <div v-if="uploading" class="upload-progress">
            <p>{{ uploadStage }}</p>
            <el-progress :percentage="uploadPercent" :status="uploadPercent === 100 ? 'success' : ''" />
          </div>

          <div class="guest-warning" v-if="!userStore.isLoggedIn">
            <el-icon><Warning /></el-icon>
            <span>当前为游客模式，数据不会保存，刷新页面后将丢失</span>
            <el-button type="primary" link @click="showAuthDialog = true; authMode = 'register'">
              立即注册保存数据
            </el-button>
          </div>
        </div>

        <div v-else class="preview-area">
          <div class="preview-header">
            <div>
              <h2>{{ bankData.title }}</h2>
              <p class="preview-meta">
                共 {{ bankData.totalQuestions }} 道题目
                <el-tag v-if="bankData.useAI" type="success" size="small" style="margin-left: 8px">
                  AI 智能解析
                </el-tag>
                <el-tag v-else type="warning" size="small" style="margin-left: 8px">
                  规则解析
                </el-tag>
              </p>
            </div>
            <div class="preview-actions">
              <el-button @click="handleReupload">重新上传</el-button>
              <el-button type="primary" @click="handleStartPractice('sequential')">
                顺序刷题
              </el-button>
              <el-button type="success" @click="handleStartPractice('random')">
                随机刷题
              </el-button>
            </div>
          </div>

          <div class="questions-preview">
            <div 
              v-for="(question, index) in bankData.questions" 
              :key="index" 
              class="question-card"
            >
              <div class="question-header">
                <span class="question-number">第 {{ index + 1 }} 题</span>
                <el-tag :type="getTypeTagType(question.type)" size="small">
                  {{ getTypeName(question.type) }}
                </el-tag>
                <el-button type="primary" link size="small" @click="handleEditQuestion(index)">
                  编辑
                </el-button>
              </div>
              <div class="question-stem">{{ question.stem }}</div>
              <div class="question-options">
                <div 
                  v-for="(option, optIndex) in question.options" 
                  :key="optIndex"
                  class="option-item"
                >
                  {{ option }}
                </div>
              </div>
              <div class="question-answer">
                <span class="label">答案：</span>
                <span class="answer-text">{{ question.answer }}</span>
              </div>
              <div v-if="question.analysis" class="question-analysis">
                <span class="label">解析：</span>
                <span>{{ question.analysis }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <el-dialog v-model="editDialogVisible" title="编辑题目" width="600px">
      <el-form v-if="editingQuestion" :model="editingQuestion" label-width="80px">
        <el-form-item label="题型">
          <el-select v-model="editingQuestion.type">
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
            <el-option label="判断题" value="judge" />
          </el-select>
        </el-form-item>
        <el-form-item label="题干">
          <el-input v-model="editingQuestion.stem" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="选项">
          <div v-for="(option, idx) in editingQuestion.options" :key="idx" class="edit-option">
            <el-input v-model="editingQuestion.options[idx]" style="flex: 1" />
            <el-button type="danger" link @click="removeOption(idx)" v-if="editingQuestion.type !== 'judge'">
              删除
            </el-button>
          </div>
          <el-button 
            v-if="editingQuestion.type !== 'judge'" 
            type="primary" 
            link 
            @click="addOption"
          >
            + 添加选项
          </el-button>
        </el-form-item>
        <el-form-item label="正确答案">
          <el-input v-model="editingQuestion.answer" placeholder="单选题如A，多选题如A,C，判断题如正确" />
        </el-form-item>
        <el-form-item label="解析">
          <el-input v-model="editingQuestion.analysis" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEditedQuestion">保存</el-button>
      </template>
    </el-dialog>

    <AuthDialog v-model="showAuthDialog" :default-mode="authMode" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadWord, uploadWordGuest } from '@/api/upload'
import { useUserStore } from '@/stores/user'
import { useGuestStore } from '@/stores/guest'
import AuthDialog from '@/components/AuthDialog.vue'

const router = useRouter()
const userStore = useUserStore()
const guestStore = useGuestStore()

const uploading = ref(false)
const uploadPercent = ref(0)
const uploadStage = ref('')
const bankData = ref(null)
const showAuthDialog = ref(false)
const authMode = ref('login')
const editDialogVisible = ref(false)
const editingIndex = ref(-1)
const editingQuestion = ref(null)

const handleFileChange = async (file) => {
  const isWord = file.name.endsWith('.doc') || file.name.endsWith('.docx')
  if (!isWord) {
    ElMessage.error('请上传 .doc 或 .docx 格式的文件')
    return
  }

  uploading.value = true
  uploadPercent.value = 0
  uploadStage.value = '正在上传文件...'

  try {
    const uploadFn = userStore.isLoggedIn ? uploadWord : uploadWordGuest
    const res = await uploadFn(file.raw, (percent) => {
      uploadPercent.value = Math.min(percent, 50)
      if (percent < 50) {
        uploadStage.value = '正在上传文件...'
      }
    })

    uploadStage.value = 'AI 正在解析题目...'
    uploadPercent.value = 70

    uploadPercent.value = 100
    uploadStage.value = '解析完成！'

    if (userStore.isLoggedIn) {
      bankData.value = {
        bankId: res.data.bankId,
        title: res.data.title,
        totalQuestions: res.data.totalQuestions,
        useAI: res.data.useAI,
        questions: res.data.questions
      }
    } else {
      guestStore.addBank(res.data)
      bankData.value = res.data
    }

    ElMessage.success('解析成功')
  } catch (err) {
    ElMessage.error(err.message || '解析失败')
  } finally {
    uploading.value = false
  }
}

const handleReupload = () => {
  bankData.value = null
}

const handleStartPractice = (mode) => {
  if (!bankData.value) return
  
  if (userStore.isLoggedIn) {
    sessionStorage.setItem('practice_mode', mode)
    sessionStorage.setItem('practice_bank_id', bankData.value.bankId)
    router.push(`/practice/${bankData.value.bankId}`)
  } else {
    const record = guestStore.startPractice(bankData.value.bankId, mode)
    if (record) {
      router.push(`/practice/${bankData.value.bankId}?recordId=${record.recordId}`)
    }
  }
}

const getTypeName = (type) => {
  const map = { single: '单选题', multiple: '多选题', judge: '判断题' }
  return map[type] || '单选题'
}

const getTypeTagType = (type) => {
  const map = { single: '', multiple: 'warning', judge: 'info' }
  return map[type] || ''
}

const handleEditQuestion = (index) => {
  editingIndex.value = index
  editingQuestion.value = JSON.parse(JSON.stringify(bankData.value.questions[index]))
  editDialogVisible.value = true
}

const addOption = () => {
  if (!editingQuestion.value) return
  const nextLetter = String.fromCharCode(65 + editingQuestion.value.options.length)
  editingQuestion.value.options.push(`${nextLetter}. `)
}

const removeOption = (index) => {
  if (!editingQuestion.value || editingQuestion.value.options.length <= 2) {
    ElMessage.warning('至少保留2个选项')
    return
  }
  editingQuestion.value.options.splice(index, 1)
  editingQuestion.value.options = editingQuestion.value.options.map((opt, idx) => {
    const letter = String.fromCharCode(65 + idx)
    return `${letter}. ${opt.replace(/^[A-Z][.、]\s*/, '')}`
  })
}

const saveEditedQuestion = () => {
  if (!editingQuestion.value || editingIndex.value < 0) return
  
  bankData.value.questions[editingIndex.value] = editingQuestion.value
  
  if (userStore.isLoggedIn) {
    ElMessage.success('保存成功')
  } else {
    guestStore.addBank(bankData.value)
    ElMessage.success('保存成功')
  }
  
  editDialogVisible.value = false
}
</script>

<style scoped>
.upload-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
}

.logo-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.main {
  flex: 1;
  padding: 40px 24px;
}

.upload-container {
  max-width: 1000px;
  margin: 0 auto;
}

.upload-area {
  background: white;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.upload-area h2 {
  margin-bottom: 8px;
  color: #303133;
}

.upload-tip {
  color: #909399;
  margin-bottom: 40px;
}

.upload-dragger {
  margin-bottom: 24px;
}

.upload-progress {
  max-width: 400px;
  margin: 24px auto 0;
  text-align: left;
}

.upload-progress p {
  margin-bottom: 8px;
  color: #606266;
}

.guest-warning {
  margin-top: 32px;
  padding: 16px 24px;
  background: #fdf6ec;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e6a23c;
  font-size: 14px;
}

.preview-area {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
}

.preview-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.preview-meta {
  color: #909399;
  margin: 0;
}

.preview-actions {
  display: flex;
  gap: 12px;
}

.questions-preview {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 24px;
  transition: box-shadow 0.3s ease;
}

.question-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.question-number {
  font-weight: 600;
  color: #409eff;
}

.question-stem {
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 16px;
  color: #303133;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.option-item {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  color: #606266;
}

.question-answer,
.question-analysis {
  padding: 8px 12px;
  background: #f0f9eb;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 8px;
}

.question-answer .label,
.question-analysis .label {
  font-weight: 600;
  color: #67c23a;
}

.answer-text {
  color: #f56c6c;
  font-weight: 600;
}

.edit-option {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    gap: 16px;
  }

  .preview-actions {
    width: 100%;
  }

  .preview-actions .el-button {
    flex: 1;
  }
}
</style>
