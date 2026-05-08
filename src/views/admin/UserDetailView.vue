<script setup lang="ts">
const user = {
  username: 'demo_user',
  email: 'demo@knowflow.ai',
  role: 'USER',
  status: 'NORMAL',
  kbCount: 4,
  docCount: 18,
  qaCount: 56,
  lastLogin: '2026-05-08 08:44',
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">用户详情</h1>
        <div class="page-desc">查看用户基础信息、知识库数量、文档数量和最近登录时间。</div>
      </div>
    </div>

    <div class="detail-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <div class="profile-head">
            <el-avatar :size="56">D</el-avatar>
            <div>
              <h2>{{ user.username }}</h2>
              <p>{{ user.email }}</p>
            </div>
          </div>
          <div class="meta-grid">
            <div><span>角色</span><strong>{{ user.role }}</strong></div>
            <div><span>状态</span><strong>{{ user.status }}</strong></div>
            <div><span>知识库</span><strong>{{ user.kbCount }}</strong></div>
            <div><span>文档</span><strong>{{ user.docCount }}</strong></div>
            <div><span>问答次数</span><strong>{{ user.qaCount }}</strong></div>
            <div><span>最近登录</span><strong>{{ user.lastLogin }}</strong></div>
          </div>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">操作</h3>
          <div class="action-list">
            <el-button type="warning">禁用用户</el-button>
            <el-button type="success">启用用户</el-button>
            <el-button>重置密码</el-button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.detail-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
}

.profile-head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.meta-grid span {
  display: block;
  color: var(--color-text-muted);
  font-size: 13px;
}

.meta-grid strong {
  display: block;
  margin-top: 6px;
}

.action-list {
  display: grid;
  gap: 10px;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
