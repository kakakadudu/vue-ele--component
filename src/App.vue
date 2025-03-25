<template>
  <div class="f_c_c p20">
    <!-- <kxcSelector
      :dataSource="data"
      :options="{
        key: 'id',
        label: 'name',
        children: 'children',
      }"
      @confirm="handleConfirm"
    /> -->
    <!-- <kxcTransfer
      :dataSource="data"
      :options="{
        key: 'id',
        label: 'name',
        children: 'children',
      }"
      @confirm="handleConfirm"
    /> -->
    <kxcCropper :cropWidth="400" :cropHeight="500" />
  </div>
</template>
<script setup>
import { onMounted, ref } from "vue";

const data = ref([]);

const init = () => {
  const list = [],
    total = Math.ceil(Math.random() * 100) + 100;
  for (let i = 0; i < total; i++) {
    let obj = {
      id: `id_${i}`,
      name: `name_${i}`,
      children: [],
    };

    const len = Math.ceil(Math.random() * 10);
    for (let j = 0; j < len; j++) {
      obj.children.push({
        id: `id_${i}_${j}`,
        name: `name_${i}_${j}`,
      });
    }
    list.push(obj);
  }
  data.value = list;
};

const handleConfirm = (selecteds, data) => {
  console.log(selecteds, data);
};

onMounted(() => {
  init();
});
</script>

<style scoped></style>
