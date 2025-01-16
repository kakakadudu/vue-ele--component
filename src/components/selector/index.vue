<template>
  <!-- 左右联动选择器 -->
  <div
    class="selector__wrapper"
    :class="{
      is__virtual: isVirtual,
    }"
    :style="{
      '--wrap-width': `${props.width}px`,
      '--wrap-height': `${props.height}px`,
      '--scroll-left-height': `${scrollLeftHeight}px`,
      '--scroll-right-height': `${scrollRightHeight}px`,
      '--item-height': `${props.lineHeight}px`,
    }"
  >
    <el-row class="selector__body">
      <el-col :span="12" class="selector__left">
        <div class="selector__left__header f-c-b">
          <div class="selector__left__header__title">父级列表</div>
          <el-checkbox
            v-model="leftCheckAll"
            :indeterminate="leftIsIndeterminate"
            @change="(val) => handCheckAllChange('left', val)"
          >
            全选
          </el-checkbox>
        </div>
        <div class="selector__left__search" v-if="showSearch">
          <el-input
            v-model="search.left"
            placeholder="请输入内容"
            clearable
            @input="(val) => handleSearch('left', val)"
          />
        </div>
        <div class="selector__list selector__left__list" ref="leftListRef">
          <div class="selector__list__virtual left__virtual">
            <div
              class="selector__item selector__left__item"
              v-for="item in leftData"
              :key="item[options.key]"
              :style="{
                transform: `translateY(${item.translateY}px)`,
              }"
            >
              <div
                class="selector__left__item__checkbox f-c-s"
                v-if="showRight"
              >
                <el-checkbox
                  v-model="item.checked"
                  :indeterminate="item.isIndeterminate"
                  @change="handleCheckedChange('left', item)"
                />
                <div
                  class="selector__left__item__label f-c-s"
                  :class="
                    active[options.key] === item[options.key] ? 'active' : ''
                  "
                  @click="handleActiveItem(item)"
                >
                  <div>{{ item[options.label] }}</div>
                  <span
                    v-if="!!item[options.children]?.length"
                    class="selector__left__item__label__total__num ml10 fs12"
                  >
                    共 {{ item[options.children].length }} 项
                  </span>
                  <span
                    v-if="!!item.checkedNum && item.isIndeterminate"
                    class="selector__left__item__label__selected__num ml5 fs12"
                  >
                    已选 {{ item.checkedNum }} 项
                  </span>
                </div>
              </div>
              <el-checkbox
                v-else
                v-model="item.checked"
                @change="handleCheckedChange('left', item)"
              >
                {{ item[options.label] }}
              </el-checkbox>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="12" class="selector__right" v-if="showRight">
        <div class="selector__right__header f-c-b">
          <div class="selector__right__header__title">子级列表</div>
          <el-checkbox
            v-model="rightCheckAll"
            :indeterminate="rightIsIndeterminate"
            @change="(val) => handCheckAllChange('right', val)"
          >
            全选
          </el-checkbox>
        </div>
        <div class="selector__right__search" v-if="showSearch">
          <el-input
            v-model="search.right"
            placeholder="请输入内容"
            clearable
            @input="(val) => handleSearch('right', val)"
          />
        </div>
        <div class="selector__list selector__right__list" ref="rightListRef">
          <div class="selector__list__virtual right__virtual">
            <div
              class="selector__item selector__right__item"
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
    <el-row class="selector__footer f-c-e mt10">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </el-row>
  </div>
</template>
<script setup>
import { onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { cloneDeep } from "@/utils.js";

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
  showRight: {
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

const showRight = ref(props.showRight);
const active = ref({});
const search = ref({});

// 递归设置选中状态
const setChildrenChecked = (list, checked) => {
  return list.map((m) => {
    m.checked = checked;
    if (!!m[options.children]?.length) {
      m[options.children] = setChildrenChecked(m[options.children], checked);
    }
    return m;
  });
};
// 设置左侧子节点选中数量
const setCheckedNum = () => {
  data.value.map((m) => {
    m.childrenCheckedAll = m[options.children]?.every((m) => !!m.checked);
    m.checkedNum = m[options.children]?.filter((m) => !!m.checked).length; // 子节点选中数量
    m.isIndeterminate = !!m.checkedNum && !m.childrenCheckedAll; // 半选状态
    return m;
  });
};
// 设置左侧选中状态
const setLeftChecked = () => {
  checkedLefts.value = data.value
    .filter((m) => !!m.checked)
    .map((m) => m[options.key]);
  // 半选状态
  leftIsIndeterminate.value =
    !!checkedLefts.value.length &&
    checkedLefts.value.length < data.value.length;
  // 全选状态
  leftCheckAll.value = !!data.value?.length
    ? data.value.every((m) => !!m.checked)
    : false;
  setCheckedNum();
};
// 设置右侧选中状态
const setRightChecked = () => {
  checkedRights.value = rightData.value
    .filter((m) => !!m.checked)
    .map((m) => m[options.key]);
  // 半选状态
  rightIsIndeterminate.value =
    !!checkedRights.value.length &&
    checkedRights.value.length < rightData.value.length;
  // 全选状态
  rightCheckAll.value = !!rightData.value?.length
    ? rightData.value.every((m) => !!m.checked)
    : false;
};

// 全选处理
const handCheckAllChange = (type, val) => {
  switch (type) {
    case "left":
      // 半选状态
      leftIsIndeterminate.value = false;
      data.value = setChildrenChecked(data.value, val);
      checkedLefts.value = data.value
        .filter((m) => !!m.checked)
        .map((m) => m[options.key]);
      setCheckedNum();
      // 设置右侧选中状态
      data.value = setChildrenChecked(data.value, val);
      setRightChecked();
      break;
    case "right":
      // 半选状态
      const find = data.value.find(
        (item) => item[options.key] === active.value[options.key]
      );
      if (find[options.children]) {
        rightIsIndeterminate.value = false;
        rightData.value = setChildrenChecked(find[options.children], val);
        checkedRights.value = rightData.value
          .filter((m) => !!m.checked)
          .map((m) => m[options.key]);
        // 当前活动列表（右侧）上级选中状态（左侧）
        active.value.checked = val;
        setLeftChecked();
      }
      break;
  }
};

// 节点选中处理
const handleCheckedChange = (type, item) => {
  switch (type) {
    case "left":
      // 设置右侧选中状态
      item[options.children] = setChildrenChecked(
        item[options.children],
        item.checked
      );
      setLeftChecked();
      if (item[options.key] === active.value[options.key]) {
        // 设置右侧选中状态
        rightData.value = setChildrenChecked(rightData.value, item.checked);
        setRightChecked();
      }
      break;
    case "right":
      setRightChecked();
      // 当前活动列表（右侧）上级选中状态（左侧）
      active.value.checked = rightCheckAll.value;
      setLeftChecked();
      break;
  }
};

// 搜索
const handleSearch = (type, val) => {
  switch (type) {
    case "left":
      leftData.value = data.value.filter((item) => {
        return item[options.label].toLowerCase().includes(val.toLowerCase());
      });
      const target = leftListRef.value;
      if (target) {
        target.scrollTop = 0;
      }
      setLeftVittual();
      break;
    case "right":
      const find = data.value.find(
        (item) => item[options.key] === active.value[options.key]
      );
      if (find[options.children]) {
        rightData.value = find[options.children].filter((item) => {
          return item[options.label].toLowerCase().includes(val.toLowerCase());
        });
      }
      break;
  }
};

// 设置右侧活动列表
const handleActiveItem = (item) => {
  active.value = item;
  rightData.value = item[options.children];
  setRightVittual();
  setRightChecked();
};

const setLeftVittual = () => {
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

const setRightVittual = () => {
  const data = active.value[options.children];
  if (props.isVirtual && !!data?.length) {
    // 滚动高度
    scrollRightHeight.value = data.length * props.lineHeight;
    data.forEach((item, idx) => {
      // 虚拟滚动
      item.translateY = idx * props.lineHeight;
    });
    if (data.length > virtualCount.value) {
      rightData.value = data.slice(0, virtualCount.value);
    }
  }
};

const handleCancel = () => {
  emit("cancel");
};
const handleConfirm = () => {
  const selecteds = data.value.filter(
    (m) => !!m.checked || !!m.isIndeterminate
  );
  emit("confirm", selecteds, data.value);
};

watch(
  () => props.dataSource,
  (val) => {
    leftData.value = data.value = [...cloneDeep(props.dataSource)];
    setLeftVittual();
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
.selector__wrapper {
  --wrap-height: 450px;
  --wrap-width: 600px;
  --item-height: 45px;
  --scroll-left-height: 450px;
  --scroll-right-height: 450px;
  width: var(--wrap-width);
  .selector__body {
    display: flex;
    overflow: hidden;
    border: 1px solid #eee;
    border-radius: 5px;
  }
}
.selector__right {
  border-left: 1px solid #eee;
}
.selector__left__header,
.selector__right__header {
  line-height: 45px;
  padding: 0 20px;
  border-bottom: 1px solid #eee;
}
.selector__left__search,
.selector__right__search {
  padding: 10px 20px;
}
.selector__left__header__title,
.selector__right__header__title {
  font-weight: 600;
  font-size: 16px;
}
.selector__left__list,
.selector__right__list {
  height: var(--wrap-height);
  overflow-y: auto;
}
.selector__left__list,
.selector__right__list {
  padding: 0 20px;
  .selector__left__item,
  .selector__right__item {
    line-height: var(--item-height);
  }
  .selector__left__item__label,
  .selector__right__item__label {
    margin-left: 10px;
    cursor: pointer;
    &.active {
      color: var(--el-color-primary);
    }
  }
}
/* 虚拟滚动 */
.selector__wrapper.is__virtual .selector__list {
  .selector__list__virtual {
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
    .selector__item {
      position: absolute;
      line-height: var(--item-height);
    }
  }
}
</style>
