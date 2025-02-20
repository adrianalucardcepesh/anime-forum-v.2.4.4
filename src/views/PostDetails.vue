<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 p-4 sm:p-6 md:p-8">
    <!-- Кнопка назад -->
    <button @click="goBack" 
            class="group mb-6 flex items-center space-x-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors duration-300">
      <i class="fas fa-arrow-left transform group-hover:-translate-x-1 transition-transform duration-300"></i>
      <span class="text-sm font-medium">Назад</span>
    </button>

    <div class="max-w-4xl mx-auto">
      <!-- Основная карточка поста -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
        <!-- Шапка поста -->
        <div class="p-6 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-start space-x-4">
            <!-- Аватар и информация об авторе -->
            <div class="flex-shrink-0 group">
              <div class="relative">
                <img :src="authorAvatar || '/images/default-avatar.png'"
                     :alt="authorName"
                     class="w-16 h-16 rounded-full object-cover ring-4 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all duration-300">
                <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"
                     v-if="isOnline"></div>
              </div>
              <div class="mt-2 text-center">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ authorName }}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ authorSignature }}</p>
              </div>
            </div>

            <!-- Заголовок и метаданные -->
            <div class="flex-1">
              <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                {{ title }}
              </h1>
              <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span class="flex items-center space-x-1">
                  <i class="fas fa-calendar"></i>
                  <span>{{ formatDate(createdAt) }}</span>
                </span>
                <span class="flex items-center space-x-1">
                  <i class="fas fa-clock"></i>
                  <span>{{ formatTime(createdAt) }}</span>
                </span>
                <span class="flex items-center space-x-1">
                  <i class="fas fa-eye"></i>
                  <span>{{ views || 0 }} просмотров</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Контент поста -->
        <div class="p-6">
          <div class="prose dark:prose-invert max-w-none">
            <div v-html="content" class="text-gray-800 dark:text-gray-200 leading-relaxed"></div>
          </div>

          <!-- Изображения -->
          <div v-if="images && images.length" class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="(image, index) in images" 
                 :key="index"
                 class="relative group cursor-pointer"
                 @click="openImage(image)">
              <img :src="image"
                   :alt="'Изображение ' + (index + 1)"
                   class="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-all duration-300">
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                <i class="fas fa-search-plus text-white text-2xl transform scale-0 group-hover:scale-100 transition-transform duration-300"></i>
              </div>
            </div>
          </div>

          <!-- Теги -->
          <div v-if="tags && tags.length" class="mt-6 flex flex-wrap gap-2">
            <span v-for="tag in tags" 
                  :key="tag"
                  class="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors duration-200 cursor-pointer">
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- Нижняя панель с действиями -->
        <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <!-- Лайк -->
              <button @click="toggleLike" 
                      class="group flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors duration-200">
                <i :class="['fas fa-heart', { 'text-red-500': isLiked, 'text-gray-400 group-hover:text-red-500': !isLiked }]"
                   class="transform group-hover:scale-125 transition-transform duration-300"></i>
                <span :class="['font-medium', isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400']">
                  {{ likes }}
                </span>
              </button>

              <!-- Комментарии -->
              <button @click="focusComment" 
                      class="group flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200">
                <i class="fas fa-comment text-gray-400 group-hover:text-blue-500 transform group-hover:scale-125 transition-all duration-300"></i>
                <span class="font-medium text-gray-500 dark:text-gray-400">{{ comments.length }}</span>
              </button>

              <!-- Поделиться -->
              <button @click="sharePost" 
                      class="group flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors duration-200">
                <i class="fas fa-share text-gray-400 group-hover:text-green-500 transform group-hover:scale-125 transition-all duration-300"></i>
                <span class="font-medium text-gray-500 dark:text-gray-400">Поделиться</span>
              </button>
            </div>

            <!-- Дополнительные действия -->
            <div class="relative">
              <button @click="toggleActions" 
                      class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <i class="fas fa-ellipsis-v text-gray-500 dark:text-gray-400"></i>
              </button>
              <!-- Выпадающее меню -->
              <div v-if="showActions" 
                   class="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-2">
                <button class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors duration-200">
                  <i class="fas fa-bookmark mr-2"></i> Сохранить
                </button>
                <button class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors duration-200">
                  <i class="fas fa-flag mr-2"></i> Пожаловаться
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Секция комментариев -->
      <div class="mt-8">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Комментарии</h2>
        
        <!-- Форма добавления комментария -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div class="flex space-x-4">
            <img :src="currentUserAvatar || '/images/default-avatar.png'"
                 alt="Your avatar"
                 class="w-10 h-10 rounded-full object-cover">
            <div class="flex-1">
              <textarea v-model="newComment"
                        ref="commentInput"
                        placeholder="Напишите комментарий..."
                        class="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white resize-none transition-all duration-200"
                        rows="3"></textarea>
              <div class="mt-3 flex justify-end">
                <button @click="submitComment"
                        :disabled="!newComment.trim()"
                        class="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg shadow-md hover:shadow-lg disabled:shadow-none transform hover:-translate-y-0.5 disabled:transform-none transition-all duration-200">
                  Отправить
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Список комментариев -->
        <div class="space-y-6">
          <div v-for="comment in comments" 
               :key="comment.id"
               class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:-translate-y-1 transition-all duration-300">
            <div class="flex space-x-4">
              <img :src="comment.authorAvatar || '/images/default-avatar.png'"
                   :alt="comment.authorName"
                   class="w-10 h-10 rounded-full object-cover">
              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">{{ comment.authorName }}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(comment.createdAt) }}</p>
                  </div>
                  <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                </div>
                <p class="text-gray-700 dark:text-gray-300">{{ comment.content }}</p>
                <div class="mt-3 flex items-center space-x-4">
                  <button class="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors duration-200">
                    <i class="fas fa-heart"></i>
                    <span>{{ comment.likes || 0 }}</span>
                  </button>
                  <button class="text-gray-500 hover:text-blue-500 transition-colors duration-200">
                    Ответить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getDatabase, ref as dbRef, get, update } from 'firebase/database';

const route = useRoute();
const router = useRouter();
const postId = route.params.id;

// Состояние
const title = ref('');
const content = ref('');
const authorName = ref('');
const authorAvatar = ref('');
const authorSignature = ref('');
const createdAt = ref(null);
const tags = ref([]);
const likes = ref(0);
const views = ref(0);
const images = ref([]);
const comments = ref([]);
const isLiked = ref(false);
const isOnline = ref(true);
const showActions = ref(false);
const newComment = ref('');
const commentInput = ref(null);
const currentUserAvatar = ref('/images/default-avatar.png');

// Получение данных поста
onMounted(async () => {
  try {
    const db = getDatabase();
    const postRef = dbRef(db, `posts/${postId}`);
    const snapshot = await get(postRef);

    if (snapshot.exists()) {
      const postData = snapshot.val();
      title.value = postData.title;
      content.value = postData.content;
      authorName.value = postData.authorName;
      authorAvatar.value = postData.authorAvatar;
      authorSignature.value = postData.authorSignature;
      createdAt.value = postData.createdAt;
      tags.value = postData.tags || [];
      likes.value = postData.likes || 0;
      views.value = postData.views || 0;
      images.value = postData.images || [];
      comments.value = postData.comments || [];
      
      // Увеличиваем счетчик просмотров
      update(postRef, {
        views: (postData.views || 0) + 1
      });
    }
  } catch (error) {
    console.error('Error fetching post:', error);
  }
});

// Методы
const goBack = () => {
  router.back();
};

const toggleLike = () => {
  isLiked.value = !isLiked.value;
  likes.value += isLiked.value ? 1 : -1;
};

const focusComment = () => {
  commentInput.value?.focus();
};

const sharePost = () => {
  // Реализация шаринга
  navigator.share({
    title: title.value,
    text: content.value,
    url: window.location.href
  }).catch(console.error);
};

const toggleActions = () => {
  showActions.value = !showActions.value;
};

const submitComment = () => {
  if (!newComment.value.trim()) return;
  
  const comment = {
    id: Date.now(),
    content: newComment.value,
    authorName: 'Текущий пользователь',
    authorAvatar: currentUserAvatar.value,
    createdAt: new Date().toISOString(),
    likes: 0
  };
  
  comments.value.unshift(comment);
  newComment.value = '';
};

const openImage = (image) => {
  // Реализация просмотра изображения в полном размере
  window.open(image, '_blank');
};

// Форматирование даты
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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
</script>

<style scoped>
/* Анимации для появления элементов */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.prose img {
  @apply rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300;
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
