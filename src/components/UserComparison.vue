<template>
  <div class="user-comparison-container">
    <el-card class="comparison-card">
      <template #header>
        <div class="card-header">
          <h2>抖音用户批量比对工具</h2>
          <div class="sub-header">输入多个抖音用户ID，批量比对视频内容并下载用户链接</div>
        </div>
      </template>
      
      <div class="form-container">
        <div class="input-section">
          <div class="input-label">用户ID（每行一个，或用逗号分隔）</div>
          <el-input
            type="textarea"
            :rows="8"
            v-model="userIds"
            placeholder="例如: user123456, user789012..."
          />
        </div>
        
        <div class="button-section">
          <el-button type="primary" @click="startComparison" :loading="loading">
            开始比对
          </el-button>
          
          <el-button @click="downloadLinks" :disabled="!hasResults || loading">
            <el-icon class="download-icon"><Download /></el-icon>
            下载用户链接
          </el-button>
        </div>
      </div>
      
      <div v-if="loading" class="loading-section">
        <el-progress :percentage="progressPercentage" :format="progressFormat" />
        <div>正在处理中，请稍候...</div>
      </div>
      
      <div v-if="hasResults && !loading" class="results-section">
        <h3>比对结果</h3>
        <el-table :data="resultData" stripe style="width: 100%">
          <el-table-column prop="userId" label="用户ID" width="180" />
          <el-table-column prop="videoCount" label="视频数量" width="120" />
          <el-table-column prop="matchRate" label="匹配率" width="120">
            <template #default="scope">
              {{ scope.row.matchRate }}%
            </template>
          </el-table-column>
          <el-table-column prop="link" label="链接">
            <template #default="scope">
              <el-link type="primary" :href="scope.row.link" target="_blank">
                {{ scope.row.link }}
              </el-link>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script>
import { Download } from '@element-plus/icons-vue'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { douyinUserApi } from '../services/api'

export default {
  name: 'UserComparison',
  components: {
    Download
  },
  setup() {
    const userIds = ref('')
    const loading = ref(false)
    const progressPercentage = ref(0)
    const resultData = ref([])
    
    const hasResults = computed(() => resultData.value.length > 0)
    
    const progressFormat = (percentage) => {
      return percentage === 100 ? '完成' : `${percentage}%`
    }
    
    const startComparison = async () => {
      if (!userIds.value.trim()) {
        ElMessage.warning('请输入至少一个用户ID')
        return
      }
      
      // 分割用户ID字符串，支持逗号分隔或换行分隔
      const ids = userIds.value
        .split(/[\n,]/)
        .map(id => id.trim())
        .filter(id => id)
      
      if (ids.length === 0) {
        ElMessage.warning('没有有效的用户ID')
        return
      }
      
      loading.value = true
      progressPercentage.value = 0
      resultData.value = []
      
      try {
        // 实际项目中，连接后端API
        // const response = await douyinUserApi.compareUsers(ids)
        // resultData.value = response.data
        
        // 目前使用模拟数据
        const totalRequests = ids.length
        let completedRequests = 0
        
        for (const id of ids) {
          // 模拟API请求延迟
          await new Promise(resolve => setTimeout(resolve, 500))
          
          completedRequests++
          progressPercentage.value = Math.floor((completedRequests / totalRequests) * 100)
          
          // 模拟添加结果数据
          resultData.value.push({
            userId: id,
            videoCount: Math.floor(Math.random() * 100) + 1,
            matchRate: Math.floor(Math.random() * 100),
            link: `https://www.douyin.com/user/${id}`
          })
        }
        
        ElMessage.success('比对完成！')
      } catch (error) {
        console.error('比对过程出错：', error)
        ElMessage.error('比对过程出错，请重试')
      } finally {
        loading.value = false
      }
    }
    
    const downloadLinks = async () => {
      if (!hasResults.value) return
      
      try {
        // 实际项目中，调用API下载链接
        // const response = await douyinUserApi.downloadUserLinks(resultData.value.map(item => item.userId))
        // 处理下载响应...
        
        // 目前使用前端生成下载
        const linksText = resultData.value
          .map(item => `${item.userId}: ${item.link}`)
          .join('\n')
        
        const blob = new Blob([linksText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = '抖音用户链接.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        ElMessage.success('链接已下载')
      } catch (error) {
        console.error('下载链接出错：', error)
        ElMessage.error('下载链接失败，请重试')
      }
    }
    
    return {
      userIds,
      loading,
      progressPercentage,
      resultData,
      hasResults,
      progressFormat,
      startComparison,
      downloadLinks
    }
  }
}
</script>

<style scoped>
.user-comparison-container {
  max-width: 1000px;
  margin: 20px auto;
}

.comparison-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.sub-header {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.form-container {
  margin-top: 20px;
}

.input-section {
  margin-bottom: 20px;
}

.input-label {
  font-size: 16px;
  color: #606266;
  margin-bottom: 10px;
}

.button-section {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.loading-section {
  margin: 20px 0;
}

.results-section {
  margin-top: 30px;
}

.results-section h3 {
  font-size: 18px;
  color: #303133;
  margin-bottom: 15px;
}

.download-icon {
  margin-right: 5px;
}
</style> 