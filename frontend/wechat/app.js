App({
  globalData: {
    apiBaseUrl: 'https://your-api-domain.com',  // 替换为您的API域名
    userInfo: null
  },

  onLaunch: function() {
    // 检查登录状态
    wx.checkSession({
      success: () => {
        // session_key 未过期
        this.getUserInfo()
      },
      fail: () => {
        // session_key 已过期，需要重新登录
        this.login()
      }
    })
  },

  login: function() {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          wx.request({
            url: `${this.globalData.apiBaseUrl}/api/auth/wechat-login`,
            method: 'POST',
            data: {
              code: res.code
            },
            success: (res) => {
              this.globalData.userInfo = res.data
              this.getUserInfo()
            }
          })
        }
      }
    })
  },

  getUserInfo: function() {
    wx.getUserInfo({
      success: (res) => {
        this.globalData.userInfo = res.userInfo
      }
    })
  }
}) 