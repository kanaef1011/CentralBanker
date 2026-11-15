import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // mở thẳng trang mô phỏng khi chạy `npm run dev`
    open: '/simulatorpage/simulator.html',
  },
  build: {
    // dự án có nhiều trang HTML, không có index.html ở gốc
    rollupOptions: {
      input: {
        simulator: resolve(import.meta.dirname, 'simulatorpage/simulator.html'),
        login: resolve(import.meta.dirname, 'loginpage/login.html'),
        signup: resolve(import.meta.dirname, 'signuppage/signup.html'),
      },
    },
  },
});
