// store/store.js
import { createStore } from 'vuex';
import authModule from './modules/auth.js';
import topicsModule from './modules/topics.js';
import pictureModule from './modules/picture.js';
import videoModule from './modules/video.js';
import musicModule from './modules/music.js';
import formatModule from './modules/format.js';
import categoriesModule from './modules/categories.js';
import profileModule from './modules/profile.js';
import emojiModule from './modules/emoji.js';
import createModule from './modules/create.js';

const store = createStore({
  modules: {
    auth: authModule,
    topics: topicsModule,
    picture: pictureModule,
    video: videoModule,
    music: musicModule,
    format: formatModule,
    categories: categoriesModule,
    profile: profileModule,
    emoji: emojiModule,
    create: createModule
  }
});

export default store;