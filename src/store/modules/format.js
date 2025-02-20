import axios from 'axios';

const state = {
  uploadedFiles: [],
  uploadProgress: {},
  baseUrl: 'http://95.164.90.115:3000'
};

const mutations = {
  ADD_FILE(state, fileData) {
    // Заменяем localhost на реальный IP сервера
    if (fileData.url.includes('localhost:3000')) {
      fileData.url = fileData.url.replace('http://localhost:3000', state.baseUrl);
    }
    // Добавляем baseUrl к относительным путям
    if (!fileData.url.startsWith('http')) {
      fileData.url = `${state.baseUrl}${fileData.url}`;
    }
    state.uploadedFiles.push(fileData);
  },
  REMOVE_FILE(state, index) {
    state.uploadedFiles.splice(index, 1);
  },
  CLEAR_FILES(state) {
    state.uploadedFiles = [];
    state.uploadProgress = {};
  },
  SET_UPLOAD_PROGRESS(state, { fileName, progress }) {
    state.uploadProgress[fileName] = progress;
  }
};

const actions = {
  validateFile({ commit }, file) {
    console.group('📄 Валидация файла');
    console.log('Проверка файла:', file.name);
    
    return new Promise((resolve, reject) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.oasis.opendocument.text',
        'text/plain',
        'application/rtf',
        'text/rtf'  // Добавляем альтернативный MIME-тип для RTF
      ];
      
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf'];
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.slice(fileName.lastIndexOf('.'));
      const hasValidExtension = allowedExtensions.includes(fileExtension);
      
      console.log('📑 Детали файла:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        extension: fileExtension,
        validExtension: hasValidExtension,
        validType: allowedTypes.includes(file.type)
      });
      
      // Проверяем или MIME-тип, или расширение файла
      if (!allowedTypes.includes(file.type) && !hasValidExtension) {
        console.error('❌ Неподдерживаемый тип файла:', {
          type: file.type,
          extension: fileExtension
        });
        console.groupEnd();
        reject(new Error('Поддерживаются только форматы DOC, DOCX, PDF, TXT, RTF и ODT'));
        return;
      }
      
      // Проверка размера (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        console.error('❌ Превышен максимальный размер файла:', {
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          maxSize: '10 MB'
        });
        console.groupEnd();
        reject(new Error('Размер файла не должен превышать 10MB'));
        return;
      }
      
      // Если файл RTF, но тип неверный, исправляем его
      if (fileExtension === '.rtf' && !file.type.includes('rtf')) {
        console.log('⚠️ Исправляем MIME-тип для RTF файла');
        // Создаем новый File объект с правильным типом
        file = new File([file], file.name, { type: 'application/rtf' });
      }
      
      console.log('✅ Файл прошел валидацию');
      console.groupEnd();
      resolve(file);
    });
  },
  
  async uploadFile({ commit, dispatch }, file) {
    console.group('📤 Загрузка файла на сервер');
    try {
      console.log('📑 Информация о файле:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        lastModified: new Date(file.lastModified).toLocaleString()
      });
      
      if (!file) {
        throw new Error('Файл не предоставлен');
      }

      // Получаем userId из localStorage
      const userId = localStorage.getItem('userId');
      console.log('👤 ID пользователя:', userId);

      if (!userId) {
        throw new Error('Необходимо авторизоваться для загрузки файлов');
      }

      await dispatch('validateFile', file);
      
      const formData = new FormData();
      formData.append('format', file);
      
      // Логируем содержимое FormData
      console.log('📦 Содержимое FormData:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, {
          name: value.name,
          type: value.type,
          size: value.size
        });
      }
      
      const uploadUrl = `${state.baseUrl}/upload/format/${userId}`;
      console.log('🌐 URL для загрузки:', uploadUrl);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': '*/*'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📊 Прогресс загрузки: ${progress}%`);
          commit('SET_UPLOAD_PROGRESS', { fileName: file.name, progress });
        }
      };

      console.log('🔧 Конфигурация запроса:', {
        url: uploadUrl,
        method: 'POST',
        headers: config.headers
      });

      try {
        console.log('📡 Отправка запроса на сервер...');
        const response = await axios.post(uploadUrl, formData, config);
        
        console.log('✅ Ответ сервера:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        });
        
        if (!response.data) {
          throw new Error('Нет данных в ответе сервера');
        }

        if (!response.data.fileUrl) {
          console.error('❌ Неверная структура ответа:', response.data);
          throw new Error('Сервер не вернул URL файла');
        }

        const fileData = {
          name: file.name,
          url: response.data.fileUrl,
          type: file.type,
          size: file.size
        };

        console.log('📄 Данные файла для сохранения:', fileData);
        commit('ADD_FILE', fileData);
        
        console.log('✨ Файл успешно загружен');
        console.groupEnd();
        return {
          success: true,
          message: response.data.message || 'Файл успешно загружен'
        };
      } catch (error) {
        console.group('❌ Детали ошибки запроса:');
        if (error.response) {
          // Ошибка от сервера
          console.log('Статус:', error.response.status);
          console.log('Текст статуса:', error.response.statusText);
          console.log('Заголовки ответа:', error.response.headers);
          console.log('Данные ответа:', error.response.data);
        } else if (error.request) {
          // Запрос был сделан, но нет ответа
          console.log('Запрос был отправлен, но нет ответа:', error.request);
        } else {
          // Ошибка при настройке запроса
          console.log('Ошибка настройки запроса:', error.message);
        }
        console.log('Конфигурация запроса:', error.config);
        console.groupEnd();
        throw error;
      }
    } catch (error) {
      console.error('❌ Ошибка при загрузке файла:', error);
      console.groupEnd();
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Ошибка при загрузке файла'
      };
    }
  },
  
  removeFile({ commit, state }, index) {
    try {
      commit('REMOVE_FILE', index);
      return {
        success: true,
        message: 'Файл успешно удален'
      };
    } catch (error) {
      console.error('Ошибка при удалении файла:', error);
      return {
        success: false,
        message: 'Ошибка при удалении файла'
      };
    }
  },

  clearFiles({ commit }) {
    commit('CLEAR_FILES');
  }
};

const getters = {
  getUploadedFiles(state) {
    return state.uploadedFiles;
  },
  getUploadProgress(state) {
    return state.uploadProgress;
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};