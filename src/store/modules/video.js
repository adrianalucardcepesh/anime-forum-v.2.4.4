import axios from 'axios';
import { ref as databaseRef, set, get } from 'firebase/database';
import { database } from '../../plugins/firebase';

const state = {
  postVideos: {},
  uploadedVideos: [],
  uploadProgress: {},
  baseUrl: 'http://95.164.90.115:3000'
};

const mutations = {
  SET_POST_VIDEOS(state, { postId, videos }) {
    const processedVideos = videos.map(url => {
      // Если URL уже полный, оставляем как есть
      if (url.startsWith('http')) {
        return url;
      }
      // Если URL относительный, добавляем базовый URL
      return `${state.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    });
    state.postVideos[postId] = processedVideos;
  },
  ADD_POST_VIDEO(state, { postId, videoUrl }) {
    if (!state.postVideos[postId]) {
      state.postVideos[postId] = [];
    }
    let processedUrl = videoUrl;
    if (videoUrl.includes('localhost:3000')) {
      processedUrl = videoUrl.replace('http://localhost:3000', state.baseUrl);
    } else if (!videoUrl.startsWith('http')) {
      processedUrl = `${state.baseUrl}${videoUrl}`;
    }
    if (!state.uploadedVideos.includes(processedUrl)) {
      state.uploadedVideos.push(processedUrl);
    } else {
      console.warn('Видео уже добавлено:', processedUrl);
    }
    state.postVideos[postId].push(processedUrl);
  },
  REMOVE_POST_VIDEO(state, { postId, videoUrl }) {
    if (state.postVideos[postId]) {
      state.postVideos[postId] = state.postVideos[postId].filter(url => url !== videoUrl);
    }
  },
  CLEAR_POST_VIDEOS(state, postId) {
    if (postId) {
      state.postVideos[postId] = [];
    } else {
      state.postVideos = {};
    }
  },
  ADD_VIDEO(state, videoUrl) {
    let processedUrl = videoUrl;
    if (videoUrl.includes('localhost:3000')) {
      processedUrl = videoUrl.replace('http://localhost:3000', state.baseUrl);
    } else if (!videoUrl.startsWith('http')) {
      processedUrl = `${state.baseUrl}${videoUrl}`;
    }
    state.uploadedVideos.push(processedUrl);
  },
  CLEAR_VIDEOS(state) {
    state.uploadedVideos = [];
  },
  REMOVE_VIDEO(state, index) {
    state.uploadedVideos.splice(index, 1);
  },
  SET_UPLOAD_PROGRESS(state, { fileName, progress }) {
    state.uploadProgress[fileName] = progress;
  }
};

const actions = {
  async validateVideo({ commit }, file) {
    return new Promise((resolve, reject) => {
      const allowedTypes = ['video/mp4', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        reject(new Error('Поддерживаются только форматы MP4 и MOV'));
        return;
      }

      const maxSize = 20 * 1024 * 1024; 
      if (file.size > maxSize) {
        reject(new Error('Размер видео не должен превышать 20MB'));
        return;
      }

      resolve(file);
    });
  },

  async uploadVideo({ commit }, formDataOrFile) {
    try {
      console.log('Начало загрузки видео');
      
      const userId = localStorage.getItem('userId') || 'default';
      let formData;
      let file;
  
      // Проверяем, получили ли мы FormData или File
      if (formDataOrFile instanceof FormData) {
        formData = formDataOrFile;
        file = formDataOrFile.get('video');
      } else {
        file = formDataOrFile;
        formData = new FormData();
        formData.append('video', file);
      }
  
      if (!file) {
        throw new Error('Файл не найден в FormData');
      }
  
      const uploadUrl = `http://95.164.90.115:3000/upload/video/${userId}`;
      console.log('Отправка запроса на:', uploadUrl);
      console.log('Тип файла:', file.type);
      console.log('Размер отправляемого файла:', (file.size / 1024 / 1024).toFixed(2), 'MB');
  
      const response = await axios.post(uploadUrl, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          commit('SET_UPLOAD_PROGRESS', { fileName: file.name, progress });
        }
      });
  
      if (response.data && response.data.fileUrl) {
        const videoUrl = response.data.fileUrl.trim();
        console.log('Итоговый URL видео:', videoUrl);
  
        // Сохраняем URL в Firebase
        const videosRef = databaseRef(database, `posts/draft/${userId}/videos`);
        const currentVideos = (await get(videosRef)).val() || [];
        await set(videosRef, [...currentVideos, videoUrl]);
  
        commit('ADD_VIDEO', videoUrl);
        return { success: true, videoUrl };
      }
      
      throw new Error('Неверный формат ответа сервера: ' + JSON.stringify(response.data));
    } catch (error) {
      console.error('Ошибка при загрузке видео:', error);
      if (error.response) {
        console.error('Статус ответа:', error.response.status);
        console.error('Заголовки ответа:', error.response.headers);
        console.error('Данные ответа:', error.response.data);
        throw new Error(`Ошибка загрузки: ${error.response.status} ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  },

  async uploadMultipleVideos({ dispatch }, files) {
    const results = await Promise.all(files.map(file => dispatch('uploadVideo', file)));
    return results.filter(result => result.success).map(result => result.videoUrl);
  },

  async savePostVideos({ commit }, { postId, videos }) {
    try {
      console.log('Сохранение видео для поста:', { postId, videos });
      const videosRef = databaseRef(database, `posts/${postId}/videos`);
      await set(videosRef, videos);
      commit('SET_POST_VIDEOS', { postId, videos });
      return { success: true };
    } catch (error) {
      console.error('Ошибка при сохранении видео:', error);
      throw error;
    }
  },

  async fetchPostVideos({ commit }, postId) {
    try {
      console.log('video/fetchPostVideos - Загрузка видео поста:', postId);
      
      // Получаем видео из Firebase
      const videosRef = databaseRef(database, `posts/${postId}/videos`);
      const snapshot = await get(videosRef);
      
      if (snapshot.exists()) {
        const videos = snapshot.val();
        // Преобразуем URL-адреса видео, если необходимо
        const processedVideos = Array.isArray(videos) ? videos : Object.values(videos);
        commit('SET_POST_VIDEOS', { postId, videos: processedVideos });
        console.log('video/fetchPostVideos - Видео загружены:', processedVideos);
        return processedVideos;
      }
      
      return [];
    } catch (error) {
      console.error('video/fetchPostVideos - Ошибка загрузки:', error);
      throw new Error('Не удалось загрузить видео поста');
    }
  },

  async removePostVideo({ commit, state }, { postId, videoUrl }) {
    try {
      console.log('video/removePostVideo - Удаление видео:', videoUrl);
      
      if (postId) {
        const videosRef = databaseRef(database, `posts/${postId}/videos`);
        const snapshot = await get(videosRef);
        
        if (snapshot.exists()) {
          const videos = snapshot.val().filter(url => url !== videoUrl);
          await set(videosRef, videos);
          commit('SET_POST_VIDEOS', { postId, videos });
        }
      } else {
        const newVideos = state.uploadedVideos.filter(url => url !== videoUrl);
        commit('CLEAR_VIDEOS');
        newVideos.forEach(url => commit('ADD_VIDEO', url));
      }
      
      console.log('video/removePostVideo - Видео удалено');
      return true;
    } catch (error) {
      console.error('video/removePostVideo - Ошибка удаления:', error);
      throw new Error('Не удалось удалить видео');
    }
  },

  clearVideos({ commit }) {
    commit('CLEAR_VIDEOS');
  }
};

const getters = {
  getPostVideos: (state) => (postId) => {
    const videos = state.postVideos[postId] || [];
    return videos.map(url => {
      if (url.includes('localhost:3000')) {
        return url.replace('http://localhost:3000', state.baseUrl);
      }
      if (!url.startsWith('http')) {
        return `${state.baseUrl}${url}`;
      }
      return url;
    });
  },
  getUploadedVideos: (state) => {
    return state.uploadedVideos.map(url => {
      if (url.includes('localhost:3000')) {
        return url.replace('http://localhost:3000', state.baseUrl);
      }
      if (!url.startsWith('http')) {
        return `${state.baseUrl}${url}`;
      }
      return url;
    });
  },
  getUploadProgress: (state) => (fileName) => state.uploadProgress[fileName] || 0
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};