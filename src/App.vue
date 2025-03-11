<script>
import UserComparison from './components/UserComparison.vue'

export default {
  name: 'App',
  components: {
    UserComparison
  }
}
</script>

<template>
  <div class="app-container">
    <UserComparison />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #f5f7fa;
  color: #333;
  line-height: 1.6;
}

.app-container {
  padding: 20px;
  min-height: 100vh;
}
</style>
