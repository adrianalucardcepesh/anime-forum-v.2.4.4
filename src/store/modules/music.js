import axios from 'axios';
import { ref as databaseRef, set, get } from 'firebase/database';
import { database } from '../../plugins/firebase';
import lamejs from 'lamejs';

const state = {
  postAudio: {},
  audioFiles: [],
  uploadProgress: {},
  baseUrl: 'http://95.164.90.115:3000'
};

const mutations = {
  SET_POST_AUDIO(state, { postId, audio }) {
    state.postAudio[postId] = audio;
  },
  ADD_AUDIO(state, audioData) {
    console.log('🎵 ADD_AUDIO мутация:', { 
      входныеДанные: audioData,
      текущиеФайлы: state.audioFiles 
    });

    if (!Array.isArray(state.audioFiles)) {
      state.audioFiles = [];
    }
    
    // Проверяем наличие URL
    if (!audioData.url) {
      console.error('❌ Отсутствует URL в данных аудио:', audioData);
      return;
    }
    
    // Обрабатываем URL
    let audioUrl = audioData.url;
    if (audioUrl.includes('localhost:3000')) {
      audioUrl = audioUrl.replace('http://localhost:3000', state.baseUrl);
    }
    if (!audioUrl.startsWith('http')) {
      audioUrl = `${state.baseUrl}${audioUrl}`;
    }

    const newAudio = {
      ...audioData,
      url: audioUrl
    };

    state.audioFiles.push(newAudio);
    
    console.log('🎵 После добавления:', { 
      добавленныйФайл: newAudio,
      всеФайлы: state.audioFiles 
    });
  },
  REMOVE_AUDIO(state, index) {
    state.audioFiles.splice(index, 1);
  },
  CLEAR_AUDIO(state) {
    state.audioFiles = [];
    state.uploadProgress = {};
  },
  SET_UPLOAD_PROGRESS(state, { fileName, progress }) {
    state.uploadProgress = {
      ...state.uploadProgress,
      [fileName]: progress
    };
  }
};

const actions = {
  async validateAudio({ commit }, file) {
    console.log(' Начало валидации аудио файла:', file.name);
    return new Promise((resolve, reject) => {
      const allowedTypes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/x-wav',
        'audio/flac',
        'audio/x-flac',
        'audio/x-aiff',
        'audio/aiff'
      ];

      if (!allowedTypes.includes(file.type)) {
        console.error(' Неподдерживаемый тип файла:', file.type);
        reject(new Error('Поддерживаются только форматы MP3, WAV, FLAC и AIFF'));
        return;
      }

      const fileName = file.name.toLowerCase();
      const allowedExtensions = ['.mp3', '.wav', '.flac', '.aiff'];
      
      if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
        console.error(' Неподдерживаемое расширение файла:', fileName);
        reject(new Error('Файл должен иметь расширение .mp3, .wav, .flac или .aiff'));
        return;
      }

      resolve(file);
    });
  },

  async uploadAudio({ commit }, file) {
    console.log('🎵 Начало загрузки аудио');
    
    try {
      // Валидация файла
      await this.dispatch('music/validateAudio', file);
      
      const fileName = file.name;
      const fileType = file.type;
      const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      
      console.log('⬆️ Начало загрузки аудио:', { fileName, fileType, fileSize });
      
      const formData = new FormData();
      formData.append('audio', file);
      
      console.log('📦 FormData содержимое:');
      for (let [key, value] of formData.entries()) {
        console.log('Ключ:', key, 'Значение:', value);
      }
      
      const userId = 'c4x6VsxAh2gEaCzICXIJPUNdet33';
      const url = `${state.baseUrl}/upload/audio/${userId}`;
      
      console.log('📤 Отправка запроса:', {
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          commit('SET_UPLOAD_PROGRESS', { fileName, progress });
          console.log('📊 Прогресс загрузки:', progress + '%');
        }
      });
      
      console.log('📥 Детали ответа сервера:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      // Проверяем доступность файла
      try {
        const checkResponse = await axios.head(response.data.url);
        console.log('🔍 Проверка доступности файла:', {
          status: checkResponse.status,
          headers: checkResponse.headers
        });
      } catch (error) {
        console.error('❌ Ошибка при проверке файла:', error);
      }

      if (response.status === 200 && response.data) {
        console.log('🔍 Проверяем структуру ответа:', {
          hasData: !!response.data,
          dataKeys: Object.keys(response.data),
          dataValues: response.data
        });

        // Проверяем различные варианты URL в ответе
        const audioUrl = response.data.url || response.data.fileUrl || (response.data.file && response.data.file.url);
        
        if (audioUrl) {
          console.log('✅ Аудио успешно загружено:', audioUrl);
          
          // Создаем объект с данными аудио
          const audioData = {
            name: fileName,
            type: fileType,
            url: audioUrl,
            size: fileSize
          };
          
          console.log('📝 Подготовленные данные аудио:', audioData);
          
          // Добавляем аудио в state
          commit('ADD_AUDIO', audioData);
          
          return { success: true, message: `✅ Файл успешно загружен: ${fileName}` };
        } else {
          console.error('❌ URL не найден в ответе:', response.data);
          throw new Error('URL аудио файла не найден в ответе сервера');
        }
      } else {
        throw new Error('Не удалось получить данные из ответа сервера');
      }
      
    } catch (error) {
      console.error('❌ Ошибка при загрузке аудио:', error);
      return { 
        success: false, 
        message: error.message || 'Произошла ошибка при загрузке аудио'
      };
    }
  },

  async uploadMultipleAudio({ dispatch }, files) {
    return Promise.all(files.map(file => dispatch('uploadAudio', file)));
  },

  async savePostAudio({ commit }, { postId, audio }) {
    try {
      const audioRef = databaseRef(database, `posts/${postId}/audio`);
      await set(audioRef, audio);
      commit('SET_POST_AUDIO', { postId, audio });
    } catch (error) {
      console.error('Ошибка при сохранении аудио для поста:', error);
      throw error;
    }
  },

  async fetchPostAudio({ commit }, postId) {
    try {
      const snapshot = await get(databaseRef(database, `posts/${postId}/audio`));
      const audioFiles = snapshot.val() || [];
      commit('SET_POST_AUDIO', { postId, audio: audioFiles });
      return audioFiles;
    } catch (error) {
      console.error('Ошибка при получении аудио поста:', error);
      throw error;
    }
  },

  async removePostAudio({ commit, state }, { postId, audioUrl }) {
    try {
      const audioFiles = state.postAudio[postId] || [];
      const updatedAudioFiles = audioFiles.filter(url => url !== audioUrl);
      
      await set(databaseRef(database, `posts/${postId}/audio`), updatedAudioFiles);
      commit('SET_POST_AUDIO', { postId, audio: updatedAudioFiles });
      
      return updatedAudioFiles;
    } catch (error) {
      console.error('Ошибка при удалении аудио из поста:', error);
      throw error;
    }
  },

  async removeAudio({ commit, state }, index) {
    try {
      const audioToRemove = state.audioFiles[index];
      if (!audioToRemove) {
        throw new Error('Аудио файл не найден');
      }

      console.log('🗑️ Удаление аудио:', {
        index,
        audioFile: audioToRemove
      });

      // Удаляем из state
      commit('REMOVE_AUDIO', index);

      return { success: true, message: '✅ Аудио файл успешно удален' };
    } catch (error) {
      console.error('❌ Ошибка при удалении аудио:', error);
      return {
        success: false,
        message: error.message || 'Произошла ошибка при удалении аудио'
      };
    }
  },

  clearAudio({ commit }) {
    commit('CLEAR_AUDIO');
  }
};

async function compressAudio(file) {
    console.log('🎵 Начало сжатия аудио:', file.name);
    
    return new Promise(async (resolve, reject) => {
      try {
        // Создаем AudioContext
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Читаем файл как ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Декодируем аудио данные
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Получаем аудио данные
        const channels = [];
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
          channels.push(audioBuffer.getChannelData(i));
        }
        
        // Создаем Lame encoder
        const mp3encoder = new lamejs.Mp3Encoder(
          audioBuffer.numberOfChannels,
          audioBuffer.sampleRate,
          320 // Высокий битрейт для качества
        );
        
        // Конвертируем float32 в int16
        const samples = new Int16Array(channels[0].length * channels.length);
        for (let i = 0; i < channels[0].length; i++) {
          for (let channel = 0; channel < channels.length; channel++) {
            const sample = channels[channel][i];
            const index = i * channels.length + channel;
            samples[index] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          }
        }
        
        // Кодируем в MP3
        const mp3Data = [];
        const sampleBlockSize = 1152; // Размер блока для MP3
        for (let i = 0; i < samples.length; i += sampleBlockSize) {
          const sampleChunk = samples.subarray(i, i + sampleBlockSize);
          const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
          if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
          }
        }
        
        // Завершаем кодирование
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }
        
        // Создаем Blob из закодированных данных
        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
        
        // Создаем новый File объект
        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.mp3'), {
          type: 'audio/mp3',
          lastModified: Date.now()
        });
        
        console.log('✅ Сжатие аудио завершено:', {
          исходныйРазмер: file.size,
          сжатыйРазмер: compressedFile.size,
          коэффициентСжатия: (file.size / compressedFile.size).toFixed(2)
        });
        
        resolve(compressedFile);
      } catch (error) {
        console.error('❌ Ошибка при сжатии аудио:', error);
        reject(error);
      }
    });
};

const getters = {
  getPostAudio: (state) => (postId) => {
    return state.postAudio[postId] || [];
  },
  getUploadProgress: (state) => (fileName) => {
    return state.uploadProgress[fileName] || 0;
  },
  getAudioFiles: (state) => {
    return state.audioFiles;
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};