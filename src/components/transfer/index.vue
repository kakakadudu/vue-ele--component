<template>
  <!-- 穿梭框 -->
  <div
    class="transfer_wrapper"
    :class="{
      is_virtual: isVirtual,
    }"
    :style="{
      '--wrap-width': `${props.width}px`,
      '--wrap-height': `${props.height}px`,
      '--scroll-left-height': `${scrollLeftHeight}px`,
      '--scroll-right-height': `${scrollRightHeight}px`,
      '--item-height': `${props.lineHeight}px`,
    }"
  >
    <el-row class="transfer_wrapper__body">
      <el-col :span="9" class="transfer_body__left">
        <div class="transfer_body__left__header f_c_b">
          <div class="transfer_body__left__header__title">未选列表</div>
          <el-checkbox
            v-model="leftCheckAll"
            :indeterminate="leftIsIndeterminate"
            @change="(val) => handCheckAllChange('left', val)"
          >
            全选
          </el-checkbox>
        </div>
        <div class="transfer_body__left__search" v-if="showSearch">
          <el-input
            v-model="search.left"
            placeholder="请输入内容"
            clearable
            @input="(val) => handleSearch('left', val)"
          />
        </div>
        <div
          class="transfer_body__list transfer_body__left__list"
          ref="leftListRef"
        >
          <div class="transfer_body__list__virtual left__virtual">
            <div
              class="transfer_body__list__item transfer_body__left__item"
              v-for="item in leftData"
              :key="item[options.key]"
              :style="{
                transform: `translateY(${item.translateY}px)`,
              }"
            >
              <div class="transfer_body__left__item__checkbox f_c_s">
                <el-checkbox
                  v-model="item.checked"
                  :indeterminate="item.isIndeterminate"
                  @change="handleCheckedChange('left', item)"
                >
                  <div>{{ item[options.label] }}</div>
                </el-checkbox>
              </div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="transfer_body__btns f_c_c">
          <el-button type="primary">
            <el-icon><ArrowLeftBold /></el-icon>
          </el-button>
          <el-button type="primary">
            <el-icon><ArrowRightBold /></el-icon>
          </el-button>
        </div>
      </el-col>
      <el-col :span="9" class="transfer_body__right">
        <div class="transfer_body__right__header f_c_b">
          <div class="transfer_body__right__header__title">已选列表</div>
          <el-checkbox
            v-model="rightCheckAll"
            :indeterminate="rightIsIndeterminate"
            @change="(val) => handCheckAllChange('right', val)"
          >
            全选
          </el-checkbox>
        </div>
        <div class="transfer_body__right__search" v-if="showSearch">
          <el-input
            v-model="search.right"
            placeholder="请输入内容"
            clearable
            @input="(val) => handleSearch('right', val)"
          />
        </div>
        <div
          class="transfer_body__list transfer_body__right__list"
          ref="rightListRef"
        >
          <div class="transfer_body__list__virtual right__virtual">
            <div
              class="transfer_body__list__item transfer_body__right__item"
              v-for="item in rightData"
              :key="item[options.key]"
              :style="{
                transform: `translateY(${item.translateY}px)`,
              }"
            >
              <el-checkbox
                v-model="item.checked"
                @change="handleCheckedChange('right', item)"
              >
                {{ item[options.label] }}
              </el-checkbox>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row class="transfer_body__footer f_c_e mt10">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </el-row>
  </div>
</template>
<script setup>
import { onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { cloneDeep } from "@/utils.js";
import { ArrowLeftBold, ArrowRightBold } from "@element-plus/icons-vue";

const emit = defineEmits(["cancel", "confirm"]);
const props = defineProps({
  dataSource: {
    type: Array,
    default: () => [],
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  isVirtual: {
    type: Boolean,
    default: true,
  },
  width: {
    type: Number,
    default: 600,
  },
  height: {
    type: Number,
    default: 450,
  },
  lineHeight: {
    type: Number,
    default: 45,
  },
  options: {
    type: Object,
    default: () => ({
      key: "key",
      label: "label",
      children: "children",
    }),
  },
});
const original = ref([]); // 原始数据
const data = ref([]);
const leftData = ref([]);
const rightData = ref([]);
const options = reactive({
  key: props.options.key,
  label: props.options.label,
  children: props.options.children,
});
const scrollLeftHeight = ref(props.height);
const scrollRightHeight = ref(props.height);
const leftListRef = ref(null);
const rightListRef = ref(null);
const virtualCount = ref(10);

const leftCheckAll = ref(false);
const leftIsIndeterminate = ref(false);
const checkedLefts = ref([]);

const rightCheckAll = ref(false);
const rightIsIndeterminate = ref(false);
const checkedRights = ref([]);

const active = ref({});
const search = ref({});

// 节点选中处理
const handleCheckedChange = (type, item) => {};

// 全选处理
const handCheckAllChange = (type, val) => {};

// 搜索
const handleSearch = (type, val) => {
  switch (type) {
    case "left":
      data.value = original.value.filter((item) => {
        return item[options.label].toLowerCase().includes(val.toLowerCase());
      });
      const target = leftListRef.value;
      if (target) {
        target.scrollTop = 0;
      }
      setLeftVitual();
      break;
    case "right":
      break;
  }
};

const setLeftVitual = () => {
  if (props.isVirtual) {
    // 滚动高度
    scrollLeftHeight.value = data.value.length * props.lineHeight;
    data.value.forEach((item, idx) => {
      // 虚拟滚动
      item.translateY = idx * props.lineHeight;
    });
    leftData.value = data.value.slice(0, virtualCount.value);
  }
};

watch(
  () => props.dataSource,
  (val) => {
    leftData.value =
      data.value =
      original.value =
        [...cloneDeep(props.dataSource)];
    setLeftVitual();
  }
);

const listen = (e, data) => {
  let arr = [];
  const offset = props.lineHeight * Math.ceil(virtualCount.value / 5);
  const top = e.target.scrollTop - offset;
  const bottom = e.target.scrollTop + e.target.clientHeight + offset;
  // top ~ bottom 显示的列表
  data.forEach((item, idx) => {
    if (item.translateY >= top && item.translateY <= bottom) {
      arr.push(item);
    }
  });
  return arr;
};

const controller = new AbortController();
const signal = controller.signal;
onMounted(() => {
  if (props.isVirtual) {
    const targetLeft = leftListRef.value;
    const targetRight = rightListRef.value;
    if (targetLeft) {
      // 虚拟滚动
      targetLeft.addEventListener(
        "scroll",
        (e) => {
          leftData.value = listen(e, data.value);
        },
        {
          capture: true,
          signal,
        }
      );
    }
    if (targetRight) {
      // 虚拟滚动
      targetRight.addEventListener(
        "scroll",
        (e) => {
          rightData.value = listen(e, active.value[options.children]);
        },
        {
          capture: true,
          signal,
        }
      );
    }
  }
});

onUnmounted(() => {
  controller.abort();
});
</script>

<style scoped>
.transfer_wrapper {
  --wrap-height: 450px;
  --wrap-width: 600px;
  --item-height: 45px;
  --scroll-left-height: 450px;
  --scroll-right-height: 450px;
  width: var(--wrap-width);
  .transfer_wrapper__body {
    display: flex;
    overflow: hidden;
    border: 1px solid #eee;
    border-radius: 5px;
  }
}
.transfer_body__left {
  border-right: 1px solid #eee;
}
.transfer_body__right {
  border-left: 1px solid #eee;
}
.transfer_body__btns {
  height: 100%;
}
.transfer_body__left__header,
.transfer_body__right__header {
  line-height: 45px;
  padding: 0 20px;
  border-bottom: 1px solid #eee;
}
.transfer_body__left__search,
.transfer_body__right__search {
  padding: 10px 20px;
}
.transfer_body__left__header__title,
.transfer_body__right__header__title {
  font-weight: 600;
  font-size: 16px;
}
.transfer_body__left__list,
.transfer_body__right__list {
  height: var(--wrap-height);
  overflow-y: auto;
}
.transfer_body__left__list,
.transfer_body__right__list {
  padding: 0 20px;
  .transfer_body__left__item,
  .transfer_body__right__item {
    line-height: var(--item-height);
  }
  .transfer_body__left__item__label,
  .transfer_body__right__item__label {
    margin-left: 10px;
    cursor: pointer;
    &.active {
      color: var(--el-color-primary);
    }
  }
}
/* 虚拟滚动 */
.transfer_wrapper.is_virtual .transfer_body__list {
  .transfer_body__list__virtual {
    position: relative;
    z-index: 1;
    width: 100%;
    height: fit-content;
    &.left__virtual {
      height: var(--scroll-left-height);
    }
    &.right__virtual {
      height: var(--scroll-right-height);
    }
    .transfer_body__list__item {
      position: absolute;
      line-height: var(--item-height);
    }
  }
}
</style>
