module.exports = {
  apps: [
    {
      name: "backend-api",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development"
      }
    },
    {
      name: "backend-worker",
      script: "dist/workers/index.js",
      instances: 1, // increase later if needed
      exec_mode: "fork",
      env: {
        NODE_ENV: "development"
      }
    }
  ]
};