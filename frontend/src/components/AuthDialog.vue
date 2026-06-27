<template>
  <el-dialog
    v-model="visible"
    :title="isLogin ? '登录' : '注册'"
    width="420px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="!isLogin" label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="账号" prop="account">
        <el-input v-model="form.account" placeholder="请输入用户名或邮箱" />
      </el-form-item>
      <el-form-item v-if="!isLogin" label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
      </el-form-item>
      <el-form-item v-if="!isLogin" label="确认密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
      </el-form-item>
    </el-form>
    <div class="auth-footer">
      <span class="switch-text" @click="toggleMode">
        {{ isLogin ? '还没有账号？去注册' : '已有账号？去登录' }}
      </span>
      <span v-if="isLogin" class="forgot-text" @click="handleForgotPassword">
        忘记密码？
      </span>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ isLogin ? '登录' : '注册' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { login, register } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const props = defineProps({
  modelValue: Boolean,
  defaultMode: {
    type: String,
    default: 'login'
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const isLogin = ref(true)

const form = ref({
  username: '',
  account: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

watch(() => props.defaultMode, (val) => {
  isLogin.value = val === 'login'
}, { immediate: true })

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = computed(() => ({
  username: [
    { required: !isLogin.value, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  account: [
    { required: isLogin.value, message: '请输入账号', trigger: 'blur' }
  ],
  email: [
    { required: !isLogin.value, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: !isLogin.value, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}))

const toggleMode = () => {
  isLogin.value = !isLogin.value
  formRef.value?.resetFields()
}

const handleForgotPassword = () => {
  visible.value = false
  router.push('/reset-password')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate()
  
  loading.value = true
  try {
    let res
    if (isLogin.value) {
      res = await login({
        account: form.value.account,
        password: form.value.password
      })
    } else {
      res = await register({
        username: form.value.username,
        email: form.value.email,
        password: form.value.password
      })
    }
    
    userStore.setToken(res.data.token)
    userStore.setUserInfo(res.data.user)
    
    ElMessage.success(isLogin.value ? '登录成功' : '注册成功')
    visible.value = false
    emit('success', res.data)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-footer {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  font-size: 14px;
}

.switch-text, .forgot-text {
  color: #409eff;
  cursor: pointer;
}

.switch-text:hover, .forgot-text:hover {
  color: #66b1ff;
}
</style>
