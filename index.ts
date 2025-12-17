import index from "./index.html";

const server = Bun.serve({
  port: 3000,
  routes: {
    "/*": index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 1DD 서버가 http://localhost:${server.port} 에서 실행 중입니다`);
