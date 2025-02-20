<template>
  <div class="post-view min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Навигация -->
      <nav class="mb-6">
        <button 
          @click="goBack" 
          class="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <i class="fas fa-arrow-left mr-2"></i>
          Назад к списку
        </button>
      </nav>

      <!-- Загрузка -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
        <p>{{ error }}</p>
      </div>

      <!-- Контент поста -->
      <div v-else-if="post">
        <PostComment 
          :comment="{
            title: post.title,
            content: post.content,
            userId: post.userId,
            username: post.username,
            userAvatar: post.userAvatar,
            timestamp: post.createdAt,
            likes: post.likes,
            replies: post.replies,
            attachments: post.attachments,
            tags: post.tags
          }"
        />

        <!-- Комментарии к посту -->
        <div v-if="comments?.length" class="mt-8">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Комментарии ({{ comments.length }})
          </h3>
          
          <div class="space-y-6">
            <PostComment
              v-for="comment in comments"
              :key="comment.id"
              :comment="comment"
            />
          </div>
        </div>

        <!-- Форма добавления комментария -->
        <div class="mt-8">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Добавить комментарий
          </h3>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <textarea
              v-model="newComment"
              rows="4"
              class="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     resize-none transition duration-200"
              placeholder="Напишите ваш комментарий..."
            ></textarea>
            <div class="mt-4 flex justify-end">
              <button
                @click="submitComment"
                class="px-6 py-2 bg-purple-600 text-white rounded-lg
                       hover:bg-purple-700 focus:ring-2 focus:ring-purple-500
                       transition duration-200"
                :disabled="!newComment.trim()"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import PostComment from '@/components/PostComment.vue'

const route = useRoute()
const router = useRouter()
const store = useStore()

const loading = ref(false)
const error = ref(null)
const newComment = ref('')

// Получаем пост из store
const post = computed(() => {
  const postId = route.params.postId
  return store.getters['posts/getPostById'](postId)
})

// Получаем комментарии для поста
const comments = computed(() => {
  const postId = route.params.postId
  return store.getters['posts/getCommentsByPostId'](postId)
})

// Форматирование даты
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  return format(new Date(timestamp), 'dd MMM yyyy HH:mm', { locale: ru })
}

// Проверка типа файла
const isImage = (type) => {
  return type?.startsWith('image/')
}

// Возврат назад
const goBack = () => {
  router.back()
}

// Отправка комментария
const submitComment = async () => {
  if (!newComment.value.trim()) return

  try {
    const postId = route.params.postId
    await store.dispatch('posts/createComment', {
      postId,
      text: newComment.value.trim()
    })
    newComment.value = ''
  } catch (error) {
    console.error('Ошибка при отправке комментария:', error)
  }
}

// Загрузка данных поста
onMounted(async () => {
  const postId = route.params.postId
  if (!postId) {
    error.value = 'ID поста не указан'
    return
  }

  loading.value = true
  try {
    await store.dispatch('posts/fetchPost', postId)
    await store.dispatch('posts/fetchComments', postId)
  } catch (err) {
    error.value = 'Ошибка при загрузке поста: ' + err.message
    console.error('Ошибка при загрузке поста:', err)
  } finally {
    loading.value = false
  }
})
</script>
