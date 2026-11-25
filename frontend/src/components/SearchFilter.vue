
<template>
  <div class="search-filter">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        @input="handleSearch"
        class="search-input"
      />
      <button 
        v-if="searchQuery" 
        class="clear-btn"
        @click="clearSearch"
      >
        ✕
      </button>
    </div>
    
    <div class="filters" v-if="$slots.filters">
      <slot name="filters" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  placeholder?: string;
  delay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Поиск...',
  delay: 300
});

const emit = defineEmits<{
  'search': [query: string];
  'clear': [];
}>();

const searchQuery = ref('');
let searchTimeout: ReturnType<typeof setTimeout>;

function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    emit('search', searchQuery.value);
  }, props.delay);
}

function clearSearch() {
  searchQuery.value = '';
  emit('clear');
  emit('search', '');
}
</script>

<style lang="scss" scoped>
.search-filter {
  margin-bottom: 20px;

  .search-box {
    position: relative;
    max-width: 400px;

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 16px;
    }

    .search-input {
      width: 100%;
      padding: 10px 40px 10px 40px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: #667eea;
      }
    }

    .clear-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      font-size: 14px;

      &:hover {
        color: #333;
      }
    }
  }

  .filters {
    margin-top: 12px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}
</style>