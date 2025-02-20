import axios from 'axios';
import { ref as databaseRef, set, get } from 'firebase/database';
import { database } from '../../plugins/firebase';
import imageCompression from 'browser-image-compression';

const state = {
  postImages: {},
  uploadedImages: [],
  uploadProgress: {},
  selectedImage: null,
  baseUrl: 'http://95.164.90.115:3000'
};

const mutations = {
  SET_POST_IMAGES(state, { postId, images }) {
    state.postImages[postId] = images;
  },
  ADD_POST_IMAGE(state, { postId, imageUrl }) {
    if (!state.postImages[postId]) {
      state.postImages[postId] = [];
    }
    state.postImages[postId].push(imageUrl);
  },
  REMOVE_POST_IMAGE(state, { postId, imageUrl }) {
    if (state.postImages[postId]) {
      state.postImages[postId] = state.postImages[postId].filter(url => url !== imageUrl);
    }
  },
  CLEAR_POST_IMAGES(state, postId) {
    if (postId) {
      state.postImages[postId] = [];
    } else {
      state.postImages = {};
    }
  },
  SET_UPLOADED_IMAGES(state, images) {
    state.uploadedImages = images;
  },
  ADD_IMAGE(state, imageUrl) {
    // Заменяем localhost на реальный IP сервера
    if (imageUrl.includes('localhost:3000')) {
      imageUrl = imageUrl.replace('http://localhost:3000', state.baseUrl);
    }
    // Добавляем baseUrl к относительным путям
    if (!imageUrl.startsWith('http')) {
      imageUrl = `${state.baseUrl}${imageUrl}`;
    }
    state.uploadedImages.push(imageUrl);
  },
  SET_UPLOAD_PROGRESS(state, { fileName, progress }) {
    state.uploadProgress[fileName] = progress;
  },
  REMOVE_IMAGE(state, index) {
    state.uploadedImages.splice(index, 1);
  },
  CLEAR_IMAGES(state) {
    state.uploadedImages = [];
    state.uploadProgress = {};
  },
  setSelectedImage(state, image) {
    state.selectedImage = image;
  }
};

const actions = {
  async compressImage({ commit }, file) {
    try {
      console.log('Начало сжатия изображения:', file.name);
      console.log(`Исходный размер: ${(file.size / 1024).toFixed(2)} KB`);
      
      // Оптимизированные параметры сжатия
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.7, // Немного уменьшаем начальное качество
        fileType: file.type,
        alwaysKeepResolution: false, // Разрешаем изменение разрешения для лучшего сжатия
        maxIteration: 2 // Ограничиваем количество итераций для ускорения
      };

      // Сжимаем изображение
      const compressedFile = await imageCompression(file, options);
      
      // Создаем новый File объект с правильным именем и типом
      const compressedBlob = await fetch(URL.createObjectURL(compressedFile)).then(r => r.blob());
      const finalFile = new File([compressedBlob], file.name, { type: file.type });

      const compressionRatio = ((1 - finalFile.size / file.size) * 100).toFixed(2);
      console.log(`Размер после сжатия: ${(finalFile.size / 1024).toFixed(2)} KB`);
      console.log(`Степень сжатия: ${compressionRatio}%`);
      
      return finalFile;
    } catch (error) {
      console.error('Ошибка при сжатии изображения:', error);
      throw new Error('Ошибка при сжатии изображения: ' + error.message);
    }
  },

  async uploadImage({ dispatch, commit, state }, file) {
    try {
      console.log('picture/uploadImage - Начало загрузки файла:', file.name);
      
      // Получаем userId из localStorage или используем дефолтное значение для тестов
      const userId = localStorage.getItem('userId') || 'default';
      
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        throw new Error('Можно загружать только изображения');
      }

      // Сжимаем изображение перед загрузкой
      const compressedFile = await dispatch('compressImage', file);
      
      const formData = new FormData();
      formData.append('image', compressedFile);
      
      const SERVER_URL = state.baseUrl;
      console.log('Отправка запроса на:', `${SERVER_URL}/upload/image/${userId}`);
      console.log('Тип файла:', compressedFile.type);
      console.log('Размер отправляемого файла:', (compressedFile.size / 1024).toFixed(2), 'KB');

      // Загружаем изображение через axios
      const response = await axios.post(`${SERVER_URL}/upload/image/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': '*/*'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          commit('SET_UPLOAD_PROGRESS', { fileName: file.name, progress });
        }
      });

      console.log('picture/uploadImage - Ответ сервера:', response.data);

      let imageUrl = response.data.imageUrl || response.data.fileUrl;
      if (imageUrl) {
        // Заменяем localhost на реальный IP сервера
        imageUrl = imageUrl.replace('http://localhost:3000', SERVER_URL);
        commit('ADD_IMAGE', imageUrl);
        return imageUrl;
      } else {
        throw new Error('Не удалось получить URL изображения');
      }
    } catch (error) {
      console.error('picture/uploadImage - Ошибка загрузки:', error);
      throw error;
    }
  },

  async uploadMultipleImages({ dispatch }, files) {
    const uploadPromises = files.map(file => dispatch('uploadImage', file));
    return Promise.all(uploadPromises);
  },

  async savePostImages({ commit }, { postId, images }) {
    try {
      commit('CLEAR_IMAGES');
      images.forEach(imageUrl => {
        commit('ADD_IMAGE', imageUrl);
      });
      console.log('picture/savePostImages - Сохранение изображений для поста:', postId);
      
      // Сохраняем изображения в Firebase
      const imagesRef = databaseRef(database, `posts/${postId}/images`);
      await set(imagesRef, images);

      // Обновляем локальное состояние
      commit('SET_POST_IMAGES', { postId, images });
      
      console.log('picture/savePostImages - Изображения сохранены:', images);
      return images;
    } catch (error) {
      console.error('picture/savePostImages - Ошибка сохранения:', error);
      throw new Error('Не удалось сохранить изображения поста');
    }
  },

  async fetchPostImages({ commit }, postId) {
    try {
      console.log('picture/fetchPostImages - Загрузка изображений поста:', postId);
      
      // Получаем изображения из Firebase
      const imagesRef = databaseRef(database, `posts/${postId}/images`);
      const snapshot = await get(imagesRef);
      
      if (snapshot.exists()) {
        const images = snapshot.val();
        commit('SET_POST_IMAGES', { postId, images });
        console.log('picture/fetchPostImages - Изображения загружены:', images);
        return images;
      }
      
      return [];
    } catch (error) {
      console.error('picture/fetchPostImages - Ошибка загрузки:', error);
      throw new Error('Не удалось загрузить изображения поста');
    }
  },

  async removePostImage({ commit, state }, { postId, imageUrl }) {
    try {
      console.log('picture/removePostImage - Удаление изображения:', imageUrl);
      
      if (postId) {
        // Если есть postId, удаляем из Firebase
        const imagesRef = databaseRef(database, `posts/${postId}/images`);
        const snapshot = await get(imagesRef);
        
        if (snapshot.exists()) {
          const images = snapshot.val().filter(url => url !== imageUrl);
          await set(imagesRef, images);
          commit('SET_POST_IMAGES', { postId, images });
        }
      } else {
        // Если нет postId, удаляем из временного хранилища
        const newImages = state.uploadedImages.filter(url => url !== imageUrl);
        commit('SET_UPLOADED_IMAGES', newImages);
      }
      
      console.log('picture/removePostImage - Изображение удалено');
      return true;
    } catch (error) {
      console.error('picture/removePostImage - Ошибка удаления:', error);
      throw new Error('Не удалось удалить изображение');
    }
  },

  async removeImage({ commit }, index) {
    try {
      commit('REMOVE_IMAGE', index);
      return { success: true, message: 'Изображение успешно удалено' };
    } catch (error) {
      console.error('Ошибка при удалении изображения:', error);
      return { success: false, message: 'Ошибка при удалении изображения' };
    }
  },

  clearImages({ commit }) {
    commit('SET_UPLOADED_IMAGES', []);
  }
};

const getters = {
  getPostImages: (state) => (postId) => state.postImages[postId] || [],
  getUploadedImages: (state) => {
    return state.uploadedImages.map(url => {
      if (url.includes('localhost:3000')) {
        return url.replace('http://localhost:3000', state.baseUrl);
      }
      if (!url.startsWith('http')) {
        return `${state.baseUrl}${url}`;
      }
      return url;
    });
  },
  getUploadProgress: (state) => (fileName) => state.uploadProgress[fileName] || 0,
  getSelectedImage: (state) => state.selectedImage
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};