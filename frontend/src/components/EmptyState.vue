
<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <h3 class="empty-title">{{ title }}</h3>
    <p class="empty-description">{{ description }}</p>
    <button v-if="actionText" class="empty-action" @click="$emit('action')">
      {{ actionText }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
}

withDefaults(defineProps<Props>(), {
  icon: '📋',
  description: ''
});

defineEmits<{
  'action': [];
}>();
</script>

<style lang="scss" scoped>
.empty-state {
  text-align: center;
  padding: 60px 20px;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 20px;
  }

  .empty-title {
    font-size: 20px;
    color: #333;
    margin-bottom: 12px;
  }

  .empty-description {
    font-size: 14px;
    color: #666;
    margin-bottom: 24px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .empty-action {
    padding: 10px 24px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #5a6fd6;
    }
  }
}
</style>