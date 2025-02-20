<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900 py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Список постов -->
      <div class="space-y-4">
        <router-link v-for="post in posts" :key="post.id" 
                    :to="{ name: 'post-details', params: { id: post.id }}"
                    class="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <div class="p-4 flex items-start space-x-4">
            <!-- Аватар пользователя -->
            <div class="flex-shrink-0">
              <img :src="post.userAvatar || '/images/default-avatar.png'" 
                   :alt="post.username"
                   class="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30">
            </div>

            <!-- Информация о посте -->
            <div class="flex-grow">
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400">
                  {{ post.title }}
                </h3>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(post.createdAt) }}
                </span>
              </div>

              <!-- Теги -->
              <div class="flex flex-wrap gap-2 mt-2">
                <span v-for="tag in post.tags" :key="tag"
                      class="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                  #{{ tag }}
                </span>
              </div>

              <!-- Мета-информация -->
              <div class="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <span class="flex items-center">
                  <i class="fas fa-user mr-1"></i>
                  {{ post.username }}
                </span>
                <span class="flex items-center">
                  <i class="fas fa-comment mr-1"></i>
                  {{ post.comments?.length || 0 }} комментариев
                </span>
                <span class="flex items-center">
                  <i class="fas fa-heart mr-1"></i>
                  {{ post.likes || 0 }} лайков
                </span>
              </div>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const store = useStore();
const router = useRouter();

// Состояние
const loading = ref(true);
const error = ref(null);

// Получение постов
const posts = computed(() => store.getters['create/allPosts']);

// Форматирование даты
function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return format(date, 'dd MMM yyyy HH:mm', { locale: ru });
}

// Загрузка постов при монтировании компонента
onMounted(async () => {
  try {
    loading.value = true;
    await store.dispatch('create/fetchPosts');
  } catch (error) {
    console.error('Ошибка при загрузке постов:', error);
    error.value = 'Не удалось загрузить посты';
  } finally {
    loading.value = false;
  }
});
</script>