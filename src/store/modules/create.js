import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, push, set, get, query, orderByChild } from 'firebase/database';

const API_BASE_URL = 'http://95.164.90.115:3000';

export default {
  namespaced: true,
  state() {
    return {
      posts: [],
      loading: false,
      error: null
    }
  },
  mutations: {
    setPosts(state, posts) {
      state.posts = posts;
    },
    setLoading(state, loading) {
      state.loading = loading;
    },
    setError(state, error) {
      state.error = error;
    },
    addPost(state, post) {
      state.posts.unshift(post);
    }
  },
  actions: {
    // Создание нового поста
    async createPost({ commit, rootState }, postData) {
      try {
        const db = getDatabase();
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          throw new Error('Пользователь не авторизован');
        }

        if (!postData.categoryId) {
          throw new Error('Не указана категория для поста');
        }

        const newPostData = {
          ...postData,
          userId: user.uid,
          authorName: user.displayName || 'Анонимный пользователь',
          authorAvatar: user.photoURL || '/images/default-avatar.png',
          createdAt: new Date().toISOString()
        };

        // Создаем новый пост в соответствующей категории
        const newPostRef = push(ref(db, `categories/${postData.categoryId}/posts`));
        await set(newPostRef, newPostData);

        return newPostRef.key;
      } catch (error) {
        console.error('Error creating post:', error);
        throw error;
      }
    },

    // Получение всех постов категории
    async fetchPosts({ commit }, categoryId) {
      try {
        commit('setLoading', true);
        const db = getDatabase();
        const postsRef = ref(db, `categories/${categoryId}/posts`);
        const postsQuery = query(postsRef, orderByChild('createdAt'));
        
        const snapshot = await get(postsQuery);
        const posts = [];
        
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            posts.unshift({
              id: childSnapshot.key,
              ...childSnapshot.val()
            });
          });
        }

        commit('setPosts', posts);
        return posts;
      } catch (error) {
        commit('setError', error.message);
        throw error;
      } finally {
        commit('setLoading', false);
      }
    }
  },
  getters: {
    allPosts: state => state.posts,
    isLoading: state => state.loading,
    error: state => state.error
  }
};
