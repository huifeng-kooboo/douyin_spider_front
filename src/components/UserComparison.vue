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
          <el-table-column prop="userId" label="用户ID" width="160" />
          <el-table-column prop="videoCount" label="视频数量" width="100" />
          <el-table-column prop="matchRate" label="匹配率" width="100">
            <template #default="scope">
              {{ scope.row.matchRate }}%
            </template>
          </el-table-column>
          <el-table-column prop="threadId" label="线程ID" width="160" />
          <el-table-column prop="status" label="状态" width="160">
            <template #default="scope">
              <el-tag 
                :type="getStatusTagType(scope.row.status)" 
                size="small" 
                v-if="scope.row.threadId">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
              <span v-if="scope.row.videosDownloaded">
                (已下载: {{ scope.row.videosDownloaded }})
              </span>
              <el-tag type="info" size="small" v-if="!scope.row.threadId">未处理</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="link" label="链接">
            <template #default="scope">
              <el-link type="primary" :href="scope.row.link" target="_blank">
                {{ scope.row.link }}
              </el-link>
              <div v-if="scope.row.error" class="error-message">
                错误: {{ scope.row.error }}
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script>
import { Download } from '@element-plus/icons-vue'
import { ref, computed, onUnmounted } from 'vue'
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
    const pollingIntervals = ref({}) // 存储每个线程ID的轮询间隔
    
    const hasResults = computed(() => resultData.value.length > 0)
    
    const progressFormat = (percentage) => {
      return percentage === 100 ? '完成' : `${percentage}%`
    }
    
    // 获取状态标签类型
    const getStatusTagType = (status) => {
      switch (status) {
        case 'completed':
          return 'success'
        case 'processing':
          return 'primary'
        case 'pending':
          return 'warning'
        case 'failed':
          return 'danger'
        default:
          return 'info'
      }
    }
    
    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'completed':
          return '已完成'
        case 'processing':
          return '处理中'
        case 'pending':
          return '等待中'
        case 'failed':
          return '失败'
        default:
          return status || '未知'
      }
    }
    
    // 获取任务状态
    const fetchTaskStatus = async (threadId, index) => {
      try {
        const taskStatus = await douyinUserApi.getTaskStatus(threadId)
        console.log(`线程 ${threadId} 状态:`, taskStatus)
        
        if (taskStatus && index >= 0 && index < resultData.value.length) {
          // 更新结果数据
          resultData.value[index] = {
            ...resultData.value[index],
            status: taskStatus.status,
            videosDownloaded: taskStatus.videos_downloaded,
            error: taskStatus.error,
            secId: taskStatus.sec_id,
            createdAt: taskStatus.created_at
          }
          
          // 如果任务已完成或失败，停止轮询
          if (taskStatus.status === 'completed' || taskStatus.status === 'failed') {
            clearInterval(pollingIntervals.value[threadId])
            delete pollingIntervals.value[threadId]
          }
        }
      } catch (error) {
        console.error(`获取线程 ${threadId} 状态出错:`, error)
      }
    }
    
    // 开始轮询任务状态
    const startPollingTaskStatus = (threadId, index) => {
      // 防止重复创建
      if (pollingIntervals.value[threadId]) {
        clearInterval(pollingIntervals.value[threadId])
      }
      
      // 立即获取一次状态
      fetchTaskStatus(threadId, index)
      
      // 每5秒轮询一次
      pollingIntervals.value[threadId] = setInterval(() => {
        fetchTaskStatus(threadId, index)
      }, 5000)
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
      
      // 清除所有现有的轮询
      Object.keys(pollingIntervals.value).forEach(key => {
        clearInterval(pollingIntervals.value[key])
      })
      pollingIntervals.value = {}
      
      loading.value = true
      progressPercentage.value = 0
      resultData.value = []
      
      try {
        // 发送请求到指定API
        const response = await douyinUserApi.sendUserList(ids)
        console.log('API响应:', response)
        
        // 处理返回数据
        if (response && response.thread_ids) {
          progressPercentage.value = 100
          
          // 将返回的数据转换为结果显示格式
          const threadIds = response.thread_ids
          
          for (let i = 0; i < Math.min(ids.length, threadIds.length); i++) {
            const threadId = threadIds[i]
            resultData.value.push({
              userId: ids[i],
              videoCount: threadId ? 1 : 0,
              matchRate: threadId ? 100 : 0,
              link: `https://www.douyin.com/user/${ids[i]}`,
              threadId: threadId,
              status: threadId ? 'pending' : '',
              videosDownloaded: 0,
              error: '',
              secId: ids[i],
              createdAt: new Date().toISOString()
            })
            
            // 如果有线程ID，开始轮询状态
            if (threadId) {
              startPollingTaskStatus(threadId, i)
            }
          }
          
          // 如果返回的thread_ids少于用户ID数量，添加剩余的用户ID
          if (threadIds.length < ids.length) {
            for (let i = threadIds.length; i < ids.length; i++) {
              resultData.value.push({
                userId: ids[i],
                videoCount: 0,
                matchRate: 0,
                link: `https://www.douyin.com/user/${ids[i]}`,
                threadId: '',
                status: '',
                videosDownloaded: 0,
                error: '',
                secId: ids[i]
              })
            }
          }
          
          ElMessage.success(response.message || '比对完成！')
        } else {
          throw new Error('API返回数据格式不正确')
        }
      } catch (error) {
        console.error('比对过程出错：', error)
        ElMessage.error('比对过程出错，请重试')
        
        // 出错时仍展示用户ID列表
        for (const id of ids) {
          resultData.value.push({
            userId: id,
            videoCount: 0,
            matchRate: 0,
            link: `https://www.douyin.com/user/${id}`,
            threadId: '',
            status: '',
            videosDownloaded: 0,
            error: '',
            secId: id
          })
        }
      } finally {
        loading.value = false
      }
    }
    
    const downloadLinks = async () => {
      if (!hasResults.value) return
      
      try {
        // 生成包含threadId的下载内容
        const linksText = resultData.value
          .map(item => {
            let line = `${item.userId}: ${item.link}`
            if (item.threadId) line += ` (线程ID: ${item.threadId})`
            if (item.status) line += ` (状态: ${getStatusText(item.status)})`
            if (item.videosDownloaded) line += ` (已下载: ${item.videosDownloaded})`
            return line
          })
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
    
    // 组件卸载时清除所有轮询
    onUnmounted(() => {
      Object.keys(pollingIntervals.value).forEach(key => {
        clearInterval(pollingIntervals.value[key])
      })
    })
    
    return {
      userIds,
      loading,
      progressPercentage,
      resultData,
      hasResults,
      progressFormat,
      startComparison,
      downloadLinks,
      getStatusTagType,
      getStatusText
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

.error-message {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 5px;
}
</style> 