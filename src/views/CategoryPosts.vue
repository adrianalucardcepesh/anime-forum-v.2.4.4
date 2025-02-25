<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Навигационные кнопки -->
      <div class="mb-8 flex justify-between items-center animate-slide-in-right">



      </div>
  
        <!-- Заголовок категории с анимацией -->
      <div class="text-center mb-12 animate-fade-in">
        <h1 class="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent mb-4 transform hover:scale-105 transition-transform duration-300">
          {{ categoryName.toUpperCase() }}
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light tracking-wide">
          {{ categoryDescription }}
        </p>
      </div>

      <!-- Кнопка создания нового поста -->
      <div class="mb-8 flex justify-between space-x-4 animate-slide-in-right">
        <router-link to="/" 
          class="inline-flex items-center group px-6 py-4 text-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
          <i class="fas fa-arrow-left mr-3 transform group-hover:-translate-x-1 transition-transform duration-300"></i>
          На главную
        </router-link>
        
        <router-link :to="{ name: 'create-post', params: { categoryId: categoryId } }"
          class="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
          <div class="flex items-center space-x-3">
            <i class="fas fa-plus text-xl transform group-hover:rotate-90 transition-transform duration-300"></i>
            <span class="text-lg font-medium tracking-wide">Создать пост</span>
          </div>
        </router-link>
      </div>

      <!-- Список постов -->
      <div v-if="posts.length > 0" class="space-y-6">
        <router-link v-for="post in sortedPosts" 
                    :key="post.id"
                    :to="{ name: 'post-details', params: { id: post.id }}"
                    class="block group ">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div class="p-8">
              <div class="flex items-start space-x-6">
                <!-- Аватар и информация об авторе -->
                <div class="flex-shrink-0 group">
                  <div class="relative">
                    <div class="w-20 ml-5  h-20 rounded-full overflow-hidden ring-4 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all duration-300">
                      <img :src="post.authorAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(post.authorName) + '&background=random'"
                           :alt="post.authorName"
                           class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                           @error="handleAvatarError">
                    </div>
                  </div>
                  <div class="mt-3 text-center">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                      {{ post.authorName }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ post.authorSignature }}
                    </p>
                  </div>
                </div>

                <!-- Основная информация -->
                <div class="flex-1">
                  <div class="flex items-start justify-between">
                    <h2 class="text-xl sm:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-purple-400 hover:to-indigo-400 transform hover:-translate-y-0.5 transition-all duration-300 tracking-wide uppercase font-sans">
                      {{ post.title }}
                    </h2>
                    <span class="flex flex-col items-end text-sm text-gray-500 dark:text-gray-400">
                      <span class="flex items-center space-x-2 text-lg">
                        <i class="fas fa-calendar-alt"></i>
                        <span>{{ formatDate(post.createdAt) }}</span>
                      </span>
                      <span class="flex items-center space-x-2 mt-2 text-lg">
                        <i class="fas fa-clock"></i>
                        <span>{{ formatTime(post.createdAt) }}</span>
                      </span>
                    </span>
                  </div>

                  <!-- Теги -->
                  <div v-if="post.tags && post.tags.length" class="mt-6 flex flex-wrap gap-3">
                    <span v-for="tag in post.tags" 
                          :key="tag"
                          class="px-4 py-2 text-base rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors duration-300 font-medium">
                      #{{ tag }}
                    </span>
                  </div>

                  <!-- Метаданные -->
                  <div class="mt-6 flex items-center justify-between text-lg">
                    <div class="flex items-center space-x-8">
                      <!-- Лайки -->
                      <div class="flex items-center space-x-2 text-gray-500 dark:text-gray-400 group/likes">
                        <i class="fas fa-heart text-xl group-hover/likes:text-red-500 transform group-hover/likes:scale-125 transition-all duration-300"></i>
                        <span>{{ post.likes || 0 }}</span>
                      </div>
                      <!-- Комментарии -->
                      <div class="flex items-center space-x-2 text-gray-500 dark:text-gray-400 group/comments">
                        <i class="fas fa-comment text-xl group-hover/comments:text-blue-500 transform group-hover/comments:scale-125 transition-all duration-300"></i>
                        <span>{{ post.comments?.length || 0 }}</span>
                      </div>
                      <!-- Просмотры -->
                      <div class="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                        <i class="fas fa-eye text-xl"></i>
                        <span>{{ post.views || 0 }}</span>
                      </div>
                    </div>
                    <!-- Индикатор перехода -->
                    <i class="fas fa-arrow-right text-2xl text-purple-500 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Сообщение об отсутствии постов -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getDatabase, ref as dbRef, get, onValue } from 'firebase/database';
import { useStore } from 'vuex';

const route = useRoute();
const store = useStore();
const categoryId = route.params.categoryId;
const posts = ref([]);
const categoryName = ref('');
const categoryDescription = ref('');

// Получение данных категории и постов
onMounted(async () => {
  try {
    const db = getDatabase();
    
    // Получаем информацию о категории
    const categoryRef = dbRef(db, `categories/${categoryId}`);
    const categorySnapshot = await get(categoryRef);
    
    if (categorySnapshot.exists()) {
      const categoryData = categorySnapshot.val();
      categoryName.value = categoryData.name;
      categoryDescription.value = categoryData.description;
      
      // Подписываемся на обновления постов в реальном времени
      const postsRef = dbRef(db, `categories/${categoryId}/posts`);
      onValue(postsRef, async (snapshot) => {
        if (snapshot.exists()) {
          const postsData = snapshot.val();
          console.log('Все посты в категории:', postsData);
          
          // Преобразуем посты в массив с получением данных пользователей
          const postsPromises = Object.entries(postsData).map(async ([id, post]) => {
            try {
              // Получаем профиль пользователя через Vuex
              await store.dispatch('profile/fetchProfile', post.authorId);
              const authorProfile = store.getters['profile/getProfile'];
              
              return {
                id,
                ...post,
                authorName: authorProfile?.username || post.authorName || 'Анонимный пользователь',
                authorAvatar: authorProfile?.avatarUrl || '/image/empty_avatar.png',
                authorSignature: authorProfile?.signature || 'Участник форума',
                authorOnline: false,
                likes: post.likes || 0,
                comments: post.comments || [],
                views: post.views || 0,
                tags: post.tags || ['форум', 'обсуждение']
              };
            } catch (error) {
              console.error(`Ошибка при получении профиля пользователя ${post.authorId}:`, error);
              return {
                id,
                ...post,
                authorName: post.authorName || 'Анонимный пользователь',
                authorAvatar: '/image/empty_avatar.png',
                authorSignature: 'Участник форума',
                authorOnline: false,
                likes: post.likes || 0,
                comments: post.comments || [],
                views: post.views || 0,
                tags: post.tags || ['форум', 'обсуждение']
              };
            }
          });
          
          posts.value = await Promise.all(postsPromises);
        }
      });
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
  }
});

// Сортировка постов по дате создания (новые сверху)
const sortedPosts = computed(() => {
  return [...posts.value].sort((a, b) => b.createdAt - a.createdAt);
});

// Форматирование даты
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

// Форматирование времени
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Обработчик ошибки загрузки аватара
const handleAvatarError = (event) => {
  // Если основное изображение не загрузилось, используем сгенерированный аватар
  const img = event.target;
  const userName = img.alt || 'User';
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`;
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

.animate-slide-in-right {
  animation: slideInRight 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Стилизация скроллбара */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800 rounded-full;
}

::-webkit-scrollbar-thumb {
  @apply bg-purple-500/50 rounded-full hover:bg-purple-600/50 transition-colors duration-300;
}
</style>