<template>
  <div class="reset-page">
    <div class="reset-card">
      <div class="reset-header">
        <el-icon size="48" color="#409eff"><Lock /></el-icon>
        <h2>{{ step === 1 ? '找回密码' : '重置密码' }}</h2>
      </div>

      <el-form v-if="step === 1" ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入注册时的邮箱" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleSendEmail">
            发送重置邮件
          </el-button>
        </el-form-item>
      </el-form>

      <el-form v-else ref="formRef2" :model="form2" :rules="rules2" label-width="100px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="form2.password" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form2.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleReset">
            重置密码
          </el-button>
        </el-form-item>
      </el-form>

      <div class="reset-footer">
        <span class="back-link" @click="$router.push('/')">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { forgotPassword, resetPassword } from '@/api/auth'

const route = useRoute()
const router = useRouter()

const formRef = ref(null)
const formRef2 = ref(null)
const loading = ref(false)
const step = ref(1)

const form = ref({
  email: ''
})

const form2 = ref({
  password: '',
  confirmPassword: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form2.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules2 = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

onMounted(() => {
  const token = route.query.token
  if (token) {
    step.value = 2
  }
})

const handleSendEmail = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate()
  
  loading.value = true
  try {
    await forgotPassword(form.value.email)
    ElMessage.success('重置密码邮件已发送，请查收邮箱')
  } finally {
    loading.value = false
  }
}

const handleReset = async () => {
  if (!formRef2.value) return
  
  await formRef2.value.validate()
  
  const token = route.query.token
  if (!token) {
    ElMessage.error('重置链接无效')
    return
  }
  
  loading.value = true
  try {
    await resetPassword(token, form2.value.password)
    ElMessage.success('密码重置成功，请重新登录')
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.reset-card {
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.reset-header {
  text-align: center;
  margin-bottom: 32px;
}

.reset-header h2 {
  margin: 16px 0 0 0;
  color: #303133;
}

.reset-footer {
  margin-top: 24px;
  text-align: center;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 14px;
  cursor: pointer;
}

.back-link:hover {
  color: #409eff;
}
</style>
