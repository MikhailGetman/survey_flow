
<template>
  <div class="pagination" v-if="totalPages > 1">
    <button 
      class="page-btn" 
      :disabled="currentPage === 1"
      @click="changePage(currentPage - 1)"
    >
      ← Назад
    </button>
    
    <div class="pages">
      <button
        v-for="page in visiblePages"
        :key="page"
        class="page-btn"
        :class="{ active: page === currentPage, ellipsis: page === '...' }"
        :disabled="page === '...'"
        @click="page !== '...' && changePage(page as number)"
      >
        {{ page }}
      </button>
    </div>
    
    <button 
      class="page-btn" 
      :disabled="currentPage === totalPages"
      @click="changePage(currentPage + 1)"
    >
      Вперед →
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'page-change': [page: number];
}>();

const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const maxVisible = 7;
  
  if (props.totalPages <= maxVisible) {
    for (let i = 1; i <= props.totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    
    let start = Math.max(2, props.currentPage - 1);
    let end = Math.min(props.totalPages - 1, props.currentPage + 1);
    
    if (props.currentPage <= 3) {
      start = 2;
      end = 4;
    }
    
    if (props.currentPage >= props.totalPages - 2) {
      start = props.totalPages - 3;
      end = props.totalPages - 1;
    }
    
    if (start > 2) {
      pages.push('...');
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (end < props.totalPages - 1) {
      pages.push('...');
    }
    
    pages.push(props.totalPages);
  }
  
  return pages;
});

function changePage(page: number) {
  if (page >= 1 && page <= props.totalPages) {
    emit('page-change', page);
  }
}
</script>

<style lang="scss" scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;

  .pages {
    display: flex;
    gap: 4px;
  }

  .page-btn {
    padding: 8px 12px;
    border: 1px solid #ddd;
    background: white;
    color: #333;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;

    &:hover:not(:disabled):not(.active):not(.ellipsis) {
      background: #f0f0f0;
      border-color: #bbb;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    &.ellipsis {
      border: none;
      cursor: default;
      
      &:hover {
        background: transparent;
      }
    }
  }
}
</style>