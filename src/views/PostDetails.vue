<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 p-4 sm:p-6 md:p-8">
    <!-- Кнопка назад -->
    <div class="max-w-4xl mx-auto">
      <button @click="goBack" 
              class="group mb-6 flex items-center space-x-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors duration-300">
        <i class="fas fa-arrow-left transform group-hover:-translate-x-1 transition-transform duration-300"></i>
        <span class="text-sm font-medium">Назад</span>
      </button>

      <!-- Загрузка -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
      </div>

      <!-- Основная карточка поста -->
      <div v-else-if="post" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <!-- Шапка поста -->
        <div class="p-6 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-start space-x-6">
            <!-- Аватар и информация об авторе -->
            <div class="flex-shrink-0 group">
              <div class="relative ml-7">
                <img :src="authorData.avatar"
                     :alt="authorData.name"
                     class="w-20 h-20 rounded-full object-cover ring-4 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all duration-300">
              </div>
              <div class="mt-3 text-center">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ authorData.name }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ authorData.signature }}</p>
              </div>
            </div>

            <!-- Основная информация -->
            <div class="flex-1">
              <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                {{ post.title }}
              </h1>
              
              <!-- Метаданные -->
              <div class="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                <span class="flex items-center">
                  <i class="fas fa-calendar-alt mr-2"></i>
                  {{ formatDate(post.createdAt) }}
                </span>
                <span class="flex items-center">
                  <i class="fas fa-clock mr-2"></i>
                  {{ formatTime(post.createdAt) }}
                </span>
              </div>

              <!-- Контент поста -->
              <div class="mt-6 prose prose-purple dark:prose-invert max-w-none">
                <div v-html="post.content"></div>
              </div>

              <!-- Теги -->
              <div v-if="post.tags && post.tags.length" class="mt-6 flex flex-wrap gap-2">
                <span v-for="tag in post.tags" 
                      :key="tag"
                      class="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
                  #{{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Действия с постом -->
        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button @click="toggleLike" 
                      class="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors duration-300">
                <i class="fas fa-heart"></i>
                <span>{{ post.likes || 0 }}</span>
              </button>
              <button class="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors duration-300"
                      @click="focusComment">
                <i class="fas fa-comment"></i>
                <span>{{ comments.length }}</span>
              </button>
            </div>
            <button @click="sharePost" 
                    class="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
              <i class="fas fa-share-alt"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Секция комментариев -->
      <div class="mt-8">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <i class="fas fa-comments mr-3 text-purple-500"></i>
          Комментарии
          <span class="ml-3 text-sm font-normal text-gray-500 dark:text-gray-400">({{ comments.length }})</span>
        </h2>

        <!-- Список комментариев -->
        <TransitionGroup 
          name="comment-list"
          tag="div"
          class="space-y-6"
        >
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg transform hover:scale-[1.02] transition-all duration-300"
          >
            <div class="p-6">
              <!-- Шапка комментария -->
              <div class="flex items-start space-x-4">
                <!-- Аватар -->
                <div class="flex-shrink-0 group relative">
                  <img 
                    :src="comment.author.avatarUrl || '/default-avatar.png'"
                    :alt="comment.author.username"
                    class="w-12 h-12 rounded-full object-cover ring-4 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all duration-300"
                  >
                  <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"
                       v-if="comment.author.online"></div>
                </div>

                <!-- Информация об авторе -->
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-lg font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300">
                        {{ comment.author.username }}
                      </h3>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ comment.author.signature || 'Участник форума' }}
                      </p>
                    </div>
                    <span class="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <i class="far fa-clock mr-2"></i>
                      {{ formatDate(comment.createdAt) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Контент комментария -->
              <div class="mt-4 pl-16">
                <div class="prose prose-purple dark:prose-invert max-w-none" v-html="comment.content"></div>
                
                <!-- Прикрепленные файлы -->
                <div v-if="comment.attachments?.length" class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div v-for="(attachment, index) in comment.attachments" 
                       :key="index"
                       class="relative group rounded-lg overflow-hidden">
                    <img 
                      v-if="attachment.type === 'image'"
                      :src="attachment.url"
                      class="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-300"
                      @click="openMediaPreview(attachment.url)"
                    >
                    <video 
                      v-else-if="attachment.type === 'video'"
                      :src="attachment.url"
                      class="w-full h-48 object-cover"
                      controls
                    ></video>
                  </div>
                </div>
              </div>

              <!-- Действия с комментарием -->
              <div class="mt-4 pl-16 flex items-center space-x-4">
                <button 
                  @click="likeComment(comment.id)"
                  class="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors duration-300"
                  :class="{ 'text-red-500': comment.isLiked }"
                >
                  <i class="fas" :class="comment.isLiked ? 'fa-heart' : 'fa-heart'"></i>
                  <span>{{ comment.likes || 0 }}</span>
                </button>
                <button 
                  @click="replyToComment(comment.id)"
                  class="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors duration-300"
                >
                  <i class="fas fa-reply"></i>
                  <span>Ответить</span>
                </button>
                <button 
                  v-if="canEditComment(comment)"
                  @click="editComment(comment.id)"
                  class="flex items-center space-x-2 text-gray-500 hover:text-purple-500 transition-colors duration-300"
                >
                  <i class="fas fa-edit"></i>
                  <span>Редактировать</span>
                </button>
              </div>
            </div>

            <!-- Вложенные ответы -->
            <div v-if="comment.replies?.length" class="border-t border-gray-100 dark:border-gray-700">
              <TransitionGroup 
                name="reply-list"
                tag="div"
                class="divide-y divide-gray-100 dark:divide-gray-700"
              >
                <div
                  v-for="reply in comment.replies"
                  :key="reply.id"
                  class="p-4 pl-16 bg-gray-50 dark:bg-gray-800/50"
                >
                  <div class="flex items-start space-x-3">
                    <img 
                      :src="reply.author.avatarUrl || '/default-avatar.png'"
                      :alt="reply.author.username"
                      class="w-8 h-8 rounded-full object-cover"
                    >
                    <div class="flex-1">
                      <div class="flex items-center space-x-2">
                        <h4 class="font-medium text-gray-900 dark:text-white">
                          {{ reply.author.username }}
                        </h4>
                        <span class="text-sm text-gray-500">{{ formatDate(reply.createdAt) }}</span>
                      </div>
                      <div class="mt-1 text-gray-700 dark:text-gray-300" v-html="reply.content"></div>
                    </div>
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </div>
        </TransitionGroup>

        <!-- Сообщение, если нет комментариев -->
        <div 
          v-if="!comments.length"
          class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm"
        >
          <i class="far fa-comments text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <p class="text-gray-500 dark:text-gray-400">Будьте первым, кто оставит комментарий!</p>
        </div>
      </div>

      <!-- Форма ответа -->
      <div class="mt-6">
        <h2 class="text-2xl font-bold mb-4">Ответить</h2>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-transform duration-300 hover:scale-105">
          <div class="flex items-center space-x-4">
            <div class="relative group">
              <img :src="currentUser.avatarUrl || '/default-avatar.png'" 
                   :alt="currentUser.username" 
                   class="w-14 h-14 rounded-full object-cover border-2 border-purple-500 shadow-md transition-transform duration-300 group-hover:scale-110">
              <div v-if="isUserOnline" class="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
            </div>
            <div class="flex-1">
              <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ currentUser.username || 'Гость' }}</div>
              <div class="text-sm text-purple-600 dark:text-purple-400 font-medium">@{{ currentUser.username || 'anonymous' }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 italic transition-opacity duration-300 hover:opacity-80">{{ currentUser.signature || 'Участник форума' }}</div>
              
              <div ref="commentEditor" contenteditable="true" 
                   class="mt-3 p-4 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow duration-300 shadow-sm hover:shadow-lg min-h-[100px] flex items-center">
                <span class="text-gray-400 text-xl">&#128172;</span>
                <span class="pl-2 text-gray-600 dark:text-gray-300">Напишите ваш комментарий...</span>
              </div>
              
              <div class="flex items-center justify-between mt-4">
                <div class="flex items-center space-x-3">
                  <button @click="openEmojiPicker" class="text-gray-500 hover:text-purple-500 transition-colors duration-300 text-xl">
                    <i class="fas fa-smile"></i>
                  </button>
                  <button @click="triggerImageUpload" class="text-gray-500 hover:text-purple-500 transition-colors duration-300 text-xl">
                    <i class="fas fa-image"></i>
                  </button>
                  <button @click="triggerVideoUpload" class="text-gray-500 hover:text-purple-500 transition-colors duration-300 text-xl">
                    <i class="fas fa-video"></i>
                  </button>
                  <button @click="attachGif" class="text-gray-500 hover:text-purple-500 transition-colors duration-300 text-xl">
                    <i class="fas fa-gift"></i>
                  </button>
                </div>
                <button @click="submitComment" 
                        class="px-4 py-2 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 dark:hover:bg-purple-500 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                  <i class="fas fa-paper-plane"></i>
                  <span>Отправить</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';

const route = useRoute();
const router = useRouter();
const store = useStore();
const toast = useToast();

const post = ref(null);
const comments = ref([]);
const newComment = ref('');
const showActions = ref(false);
const isLoading = ref(true);

// Получаем данные поста и автора
onMounted(async () => {
  const postId = route.params.id;
  try {
    isLoading.value = true;
    
    // Загружаем пост (теперь включает данные автора)
    const postData = await store.dispatch('posts/fetchPostById', postId);
    post.value = postData;
    
    // Загружаем комментарии
    const commentsData = await store.dispatch('posts/fetchComments', postId);
    comments.value = commentsData || [];
    
    isLoading.value = false;
  } catch (error) {
    console.error('Error loading post:', error);
    isLoading.value = false;
  }
});

// Обновляем вычисляемое свойство для данных автора
const authorData = computed(() => {
  if (post.value?.author) {
    return {
      name: post.value.author.username || 'Неизвестный пользователь',
      avatar: post.value.author.avatarUrl || '/image/empty_avatar.png',
      signature: post.value.author.signature || 'Участник форума'
    };
  }
  return {
    name: 'Неизвестный пользователь',
    avatar: '/image/empty_avatar.png',
    signature: 'Участник форума'
  };
});

// Получаем информацию о текущем пользователе из Vuex store
const currentUser = computed(() => {
  const profile = store.state.profile.profile;
  return {
    username: profile.username || '',
    avatarUrl: profile.avatarUrl || '/default-avatar.png',
    signature: profile.signature || 'Участник форума'
  };
});

// Проверяем онлайн-статус пользователя
const isUserOnline = computed(() => store.state.auth.status === 'authenticated');

// Переменные для формы комментария
const commentEditor = ref(null);
const commentContent = ref('');
const commentImages = ref([]);

// Инструменты форматирования
const formatTools = [
  { icon: 'fas fa-bold', format: 'bold', tooltip: 'Жирный' },
  { icon: 'fas fa-italic', format: 'italic', tooltip: 'Курсив' },
  { icon: 'fas fa-underline', format: 'underline', tooltip: 'Подчеркнутый' },
  { icon: 'fas fa-quote-right', format: 'quote', tooltip: 'Цитата' }
];

// Методы для работы с редактором
const applyFormat = (format) => {
  document.execCommand(format, false, null);
  commentEditor.value.focus();
};

const handleCommentInput = (event) => {
  commentContent.value = event.target.innerHTML;
};

const openEmojiPicker = () => {
  // Реализация открытия окна с эмодзи
  console.log('Открытие окна с эмодзи');
};

const triggerImageUpload = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        // Загружаем изображение в Firebase Storage
        const imageUrl = await store.dispatch('uploadImage', file);
        commentImages.value.push(imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Ошибка при загрузке изображения');
      }
    }
  };
  input.click();
};

const triggerVideoUpload = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'video/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Загружаем видео в Firebase Storage
        const videoUrl = await store.dispatch('uploadVideo', file);
        commentImages.value.push({ type: 'video', url: videoUrl });
      } catch (error) {
        console.error('Error uploading video:', error);
        toast.error('Ошибка при загрузке видео');
      }
    }
  };
  input.click();
};

const removeCommentImage = (index) => {
  commentImages.value.splice(index, 1);
};

const handleImageError = (event) => {
  event.target.src = '/default-image.png';
};

const submitComment = async () => {
  try {
    if (!commentContent.value.trim()) {
      return;
    }

    const commentData = {
      postId: post.value.id,
      content: commentContent.value,
      attachments: commentImages.value,
      createdAt: new Date().toISOString()
    };

    await store.dispatch('posts/createComment', commentData);
    
    // Очищаем форму
    commentContent.value = '';
    commentImages.value = [];
    if (commentEditor.value) {
      commentEditor.value.innerHTML = '';
    }

    toast.success('Комментарий успешно добавлен!');
  } catch (error) {
    console.error('Error submitting comment:', error);
    toast.error('Не удалось отправить комментарий');
  }
};

// Методы
const goBack = () => {
  router.back();
};

const toggleLike = async () => {
  try {
    await store.dispatch('posts/toggleLike', post.value.id);
  } catch (error) {
    console.error('Error toggling like:', error);
  }
};

const focusComment = () => {
  const commentInput = document.querySelector('#comment-input');
  if (commentInput) {
    commentInput.focus();
  }
};

const sharePost = async () => {
  try {
    await navigator.share({
      title: post.value.title,
      text: post.value.content,
      url: window.location.href
    });
  } catch (error) {
    console.error('Error sharing post:', error);
  }
};

const likeComment = async (commentId) => {
  try {
    await store.dispatch('posts/likeComment', commentId);
  } catch (error) {
    console.error('Error liking comment:', error);
  }
};

const replyToComment = (commentId) => {
  // Реализация ответа на комментарий
  console.log('Ответ на комментарий:', commentId);
};

const canEditComment = (comment) => {
  // Реализация проверки возможности редактирования комментария
  console.log('Проверка возможности редактирования комментария:', comment);
  return true;
};

const editComment = (commentId) => {
  // Реализация редактирования комментария
  console.log('Редактирование комментария:', commentId);
};

const openMediaPreview = (url) => {
  // Реализация открытия медиа-превью
  console.log('Открытие медиа-превью:', url);
};

// Форматирование даты и времени
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.comment-list-enter-active,
.comment-list-leave-active,
.reply-list-enter-active,
.reply-list-leave-active {
  transition: all 0.5s ease;
}

.comment-list-enter-from,
.comment-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.reply-list-enter-from,
.reply-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.prose :deep(p) {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.prose :deep(a) {
  color: #6366f1;
  text-decoration: none;
  transition: color 0.2s;
}

.prose :deep(a:hover) {
  color: #4f46e5;
}
</style>
