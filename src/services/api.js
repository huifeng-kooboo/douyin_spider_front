import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加认证token等
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    return Promise.reject(error)
  }
)

// 抖音用户API
export const douyinUserApi = {
  // 批量比对用户视频
  compareUsers(userIds) {
    return api.post('/douyin/compare', { userIds })
  },
  
  // 获取用户信息
  getUserInfo(userId) {
    return api.get(`/douyin/user/${userId}`)
  },
  
  // 获取用户视频列表
  getUserVideos(userId, params) {
    return api.get(`/douyin/user/${userId}/videos`, { params })
  },
  
  // 下载用户链接
  downloadUserLinks(userIds) {
    return api.post('/douyin/download-links', { userIds }, { 
      responseType: 'blob' 
    })
  }
}

export default api 