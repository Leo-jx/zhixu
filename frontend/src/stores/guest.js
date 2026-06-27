import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGuestStore = defineStore('guest', () => {
  const banks = ref({})
  const practiceRecords = ref({})
  const wrongQuestions = ref([])
  const initialized = ref(false)

  const init = () => {
    if (initialized.value) return
    
    const savedBanks = sessionStorage.getItem('guest_banks')
    const savedRecords = sessionStorage.getItem('guest_records')
    const savedWrong = sessionStorage.getItem('guest_wrong')

    if (savedBanks) {
      banks.value = JSON.parse(savedBanks)
    }
    if (savedRecords) {
      practiceRecords.value = JSON.parse(savedRecords)
    }
    if (savedWrong) {
      wrongQuestions.value = JSON.parse(savedWrong)
    }
    
    initialized.value = true
  }

  const saveBanks = () => {
    sessionStorage.setItem('guest_banks', JSON.stringify(banks.value))
  }

  const saveRecords = () => {
    sessionStorage.setItem('guest_records', JSON.stringify(practiceRecords.value))
  }

  const saveWrong = () => {
    sessionStorage.setItem('guest_wrong', JSON.stringify(wrongQuestions.value))
  }

  const addBank = (bankData) => {
    banks.value[bankData.bankId] = bankData
    saveBanks()
  }

  const getBank = (bankId) => {
    return banks.value[bankId] || null
  }

  const startPractice = (bankId, mode) => {
    const bank = banks.value[bankId]
    if (!bank) return null

    let questionIds = bank.questions.map(q => q.id)
    if (mode === 'random') {
      questionIds = questionIds.sort(() => Math.random() - 0.5)
    }

    const recordId = 'guest_record_' + Date.now()
    const record = {
      recordId,
      bankId,
      mode,
      questionIds,
      currentIndex: 0,
      totalAnswered: 0,
      correctCount: 0,
      wrongCount: 0,
      answers: {},
      markedQuestions: [],
      status: 'in_progress',
      startTime: Date.now()
    }

    practiceRecords.value[recordId] = record
    saveRecords()
    return record
  }

  const submitAnswer = (recordId, questionId, userAnswer, isMarked = false) => {
    const record = practiceRecords.value[recordId]
    const bank = banks.value[record.bankId]
    if (!record || !bank) return null

    const question = bank.questions.find(q => q.id === questionId)
    if (!question) return null

    const isCorrect = userAnswer && userAnswer.toUpperCase() === question.answer.toUpperCase()

    const alreadyAnswered = record.answers[questionId]
    if (!alreadyAnswered) {
      record.totalAnswered++
      if (isCorrect) {
        record.correctCount++
      } else {
        record.wrongCount++
        addWrongQuestion(bank.bankId, question)
      }
    }

    record.answers[questionId] = {
      userAnswer,
      isCorrect,
      isMarked
    }

    if (isMarked && !record.markedQuestions.includes(questionId)) {
      record.markedQuestions.push(questionId)
    }

    saveRecords()
    return { isCorrect, correctAnswer: question.answer }
  }

  const addWrongQuestion = (bankId, question) => {
    const existing = wrongQuestions.value.find(wq => wq.id === question.id)
    if (existing) {
      existing.wrongCount++
      existing.lastWrongAt = Date.now()
    } else {
      wrongQuestions.value.push({
        ...question,
        bankId,
        wrongCount: 1,
        lastWrongAt: Date.now()
      })
    }
    saveWrong()
  }

  const endPractice = (recordId) => {
    const record = practiceRecords.value[recordId]
    if (record) {
      record.status = 'completed'
      record.endTime = Date.now()
      saveRecords()
    }
    return record
  }

  const getRecord = (recordId) => {
    return practiceRecords.value[recordId] || null
  }

  const clearAll = () => {
    banks.value = {}
    practiceRecords.value = {}
    wrongQuestions.value = []
    sessionStorage.removeItem('guest_banks')
    sessionStorage.removeItem('guest_records')
    sessionStorage.removeItem('guest_wrong')
  }

  return {
    banks,
    practiceRecords,
    wrongQuestions,
    init,
    addBank,
    getBank,
    startPractice,
    submitAnswer,
    endPractice,
    getRecord,
    clearAll
  }
})
