<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
      <!-- Кнопка закрытия -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <i class="fas fa-times"></i>
      </button>

      <!-- Заголовок -->
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ title }}</h2>

      <!-- Контент -->
      <div class="prose dark:prose-invert max-w-none mb-6" v-html="sanitizedContent"></div>

      <!-- Теги -->
      <div v-if="tags && tags.length" class="flex flex-wrap gap-2 mb-6">
        <span
          v-for="tag in tags"
          :key="tag"
          class="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full text-sm"
        >
          #{{ tag }}
        </span>
      </div>

      <!-- Изображения -->
      <div v-if="images && images.length" class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div v-for="(image, index) in images" :key="index" class="relative group">
          <img
            :src="image.replace('http://localhost:3000', 'http://95.164.90.115:3000')"
            :alt="'Image ' + index"
            class="w-full h-48 object-cover rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
            @click="openFullImage(image)"
          >
          <button
            @click.stop="$emit('removeImage', index)"
            class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>

      <!-- Видео -->
      <div v-if="videos && videos.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="(video, index) in videos" :key="index" class="relative group">
          <div class="aspect-w-16 aspect-h-9 cursor-pointer" @click="openFullVideo(video)">
            <video
              ref="videoPlayer"
              :src="video.replace('http://localhost:3000', 'http://95.164.90.115:3000')"
              class="w-full rounded-lg shadow-md object-cover"
              controls
              preload="auto"
              @loadedmetadata="onVideoLoad($event, index)"
              @error="onVideoError($event, index)"
            >
              Ваш браузер не поддерживает видео.
            </video>
          </div>
          <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {{ videoDurations[index] || '0:00' }}
          </div>
          <button
            @click.stop="$emit('removeVideo', index)"
            class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно для полноразмерного изображения -->
    <div v-if="fullScreenImage" 
         class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60]"
         @click="fullScreenImage = null">
      <button 
        @click="fullScreenImage = null"
        class="absolute top-4 right-4 text-white hover:text-gray-300 text-xl"
      >
        <i class="fas fa-times"></i>
      </button>
      
      <!-- Кнопка "Предыдущее изображение" -->
      <button 
        v-if="currentImageIndex > 0"
        @click.stop="showPrevImage"
        class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-3xl"
      >
        <i class="fas fa-chevron-left"></i>
      </button>

      <img 
        :src="fullScreenImage.replace('http://localhost:3000', 'http://95.164.90.115:3000')"
        class="max-h-[90vh] max-w-[90vw] object-contain"
        @click.stop
      >

      <!-- Кнопка "Следующее изображение" -->
      <button 
        v-if="currentImageIndex < images.length - 1"
        @click.stop="showNextImage"
        class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-3xl"
      >
        <i class="fas fa-chevron-right"></i>
      </button>

      <!-- Индикатор текущего изображения -->
      <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
        {{ currentImageIndex + 1 }} / {{ images.length }}
      </div>
    </div>

    <!-- Модальное окно для полноразмерного видео -->
    <div v-if="fullScreenVideo" 
         class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60]"
         @click="fullScreenVideo = null">
      <button 
        @click="fullScreenVideo = null"
        class="absolute top-4 right-4 text-white hover:text-gray-300 text-xl"
      >
        <i class="fas fa-times"></i>
      </button>
      
      <!-- Кнопка "Предыдущее видео" -->
      <button 
        v-if="currentVideoIndex > 0"
        @click.stop="showPrevVideo"
        class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-3xl"
      >
        <i class="fas fa-chevron-left"></i>
      </button>

      <div class="relative max-w-[90vw] max-h-[90vh]" @click.stop>
        <video 
          :src="fullScreenVideo.replace('http://localhost:3000', 'http://95.164.90.115:3000')"
          class="max-h-[90vh] w-auto"
          controls
          autoplay
        >
          Ваш браузер не поддерживает видео.
        </video>
      </div>

      <!-- Кнопка "Следующее видео" -->
      <button 
        v-if="currentVideoIndex < videos.length - 1"
        @click.stop="showNextVideo"
        class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-3xl"
      >
        <i class="fas fa-chevron-right"></i>
      </button>

      <!-- Индикатор текущего видео -->
      <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
        {{ currentVideoIndex + 1 }} / {{ videos.length }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import DOMPurify from 'dompurify';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  tags: {
    type: Array,
    default: () => []
  },
  images: {
    type: Array,
    default: () => []
  },
  videos: {
    type: Array,
    default: () => []
  }
});

const fullScreenImage = ref(null);
const fullScreenVideo = ref(null);
const currentImageIndex = ref(0);
const currentVideoIndex = ref(0);
const videoDurations = ref({});

// Функции для изображений
const openFullImage = (image) => {
  fullScreenImage.value = image;
  currentImageIndex.value = props.images.findIndex(img => img === image);
};

const showNextImage = () => {
  if (currentImageIndex.value < props.images.length - 1) {
    currentImageIndex.value++;
    fullScreenImage.value = props.images[currentImageIndex.value];
  }
};

const showPrevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
    fullScreenImage.value = props.images[currentImageIndex.value];
  }
};

// Функции для видео
const openFullVideo = (video) => {
  fullScreenVideo.value = video;
  currentVideoIndex.value = props.videos.findIndex(v => v === video);
};

const showNextVideo = () => {
  if (currentVideoIndex.value < props.videos.length - 1) {
    currentVideoIndex.value++;
    fullScreenVideo.value = props.videos[currentVideoIndex.value];
  }
};

const showPrevVideo = () => {
  if (currentVideoIndex.value > 0) {
    currentVideoIndex.value--;
    fullScreenVideo.value = props.videos[currentVideoIndex.value];
  }
};

const onVideoLoad = (event, index) => {
  const duration = event.target.duration;
  videoDurations.value[index] = formatDuration(duration);
};

const onVideoError = (event, index) => {
  console.error(`Error loading video at index ${index}:`, event);
};

const formatDuration = (duration) => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Очищаем HTML и сохраняем форматирование
const sanitizedContent = computed(() => {
  const formattedText = formatText(props.content);
  return DOMPurify.sanitize(formattedText, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'blockquote', 'pre', 'code'],
    ALLOWED_ATTR: []
  });
});

defineEmits(['close', 'removeImage', 'removeVideo']);

function formatText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/\n/g, '<br>');
}
</script>

<style scoped>
.aspect-w-16 {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
}

.aspect-w-16 > * {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

/* Стили для прокрутки */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>