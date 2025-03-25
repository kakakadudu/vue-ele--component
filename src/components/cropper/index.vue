<template>
  <div class="image-cropper f_s_b">
    <div>
      <el-upload
        class="upload-image"
        action="#"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
        v-if="!option.imageSrc"
      >
        <template #trigger>
          <div
            class="cropper-bg f_c_c"
            :style="{
              width: `${option.width}px`,
              height: `${option.height}px`,
            }"
          >
            请选择图片
          </div>
        </template>
      </el-upload>
      <div
        ref="cropperRef"
        class="cropper-bg"
        :style="{
          width: `${option.width}px`,
          height: `${option.height}px`,
        }"
        v-if="option.imageSrc"
      >
        <div
          class="cropper-container"
          :style="{
            width: `${option.cropWidth}px`,
            height: `${option.cropHeight}px`,
          }"
        >
          <img
            class="cropper-image"
            :src="option.imageSrc"
            @load="startDrawImage"
          />
          <canvas ref="canvasRef"></canvas>
          <div class="crop-overlay">
            <div
              class="crop-area"
              :style="cropAreaStyle"
              @mousedown="startDrag"
            ></div>
          </div>
        </div>
      </div>
      <div class="cropper-btns mt20 f_c_e" v-if="option.imageSrc">
        <el-button @click="handleZoom('in')">
          <el-icon><Plus /></el-icon>
        </el-button>
        <el-button @click="handleZoom">
          <el-icon><Minus /></el-icon>
        </el-button>
        <el-button @click="handleRotate(-90)">
          <el-icon><RefreshLeft /></el-icon>
        </el-button>
        <el-button @click="handleRotate(90)">
          <el-icon><RefreshRight /></el-icon>
        </el-button>
        <el-upload
          class="upload-image ml12"
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
        >
          <template #trigger>
            <el-button type="primary">重新上传</el-button>
          </template>
        </el-upload>
      </div>
    </div>
    <div class="preview-image ml40">
      <div
        class="cropped-image"
        :style="{
          width: option.cropWidth + 'px',
          height: option.cropHeight + 'px',
        }"
      >
        <img
          v-if="option.croppedImageSrc"
          :src="option.croppedImageSrc"
          alt="Cropped Image"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { watch, reactive, ref, computed, onMounted, onUnmounted } from "vue";
import {
  Plus,
  Minus,
  RefreshLeft,
  RefreshRight,
} from "@element-plus/icons-vue";

const props = defineProps({
  // 裁剪框宽度
  cropWidth: {
    type: Number,
    default: 300,
  },
  // 裁剪框高度
  cropHeight: {
    type: Number,
    default: 400,
  },
  // 图片地址
  imageSrc: {
    type: String,
    default: "",
  },
});

const cw = computed(() => {
  return props.cropWidth;
});
const ch = computed(() => {
  return props.cropHeight;
});

const option = ref({
  width: 500, // 容器宽
  height: 500, // 容器高
  imageSrc: null, // 图片地址
  croppedImageSrc: null, // 裁剪后的图片地址
  cropStartX: 100, // 裁剪框起始点 x 坐标
  cropStartY: 50, // 裁剪框起始点 y 坐标
  cropWidth: cw.value || 300, // 裁剪框宽度
  cropHeight: ch.value || 400, // 裁剪框高度
  imageWidth: 0, // 图片原始宽
  imageHeight: 0, // 图片原始高
  rotation: 0, // 旋转角度
  scale: 1, // 缩放比例
});

const cropperRef = ref(null);
const canvasRef = ref(null);
const dragOption = reactive({
  isDragging: false,
  startX: 0,
  startY: 0,
  direction: "",
  dragCount: 0,
  right: 0,
});

// 计算剪裁框的位置和大小
const cropAreaStyle = computed(() => {
  return {
    width: `${option.value.cropWidth}px`,
    height: `${option.value.cropHeight}px`,
    left: `${option.value.cropStartX}px`,
    top: `${option.value.cropStartY}px`,
  };
});

const handleFileChange = (rawFile) => {
  console.log("handleFileChange", rawFile);
  const { size, raw } = rawFile;
  const { type } = raw;
  if (raw) {
    if (!["image/jpeg", "image/png"].includes(type)) {
      ElMessage.warning("只允许上传 jpg、png 格式的图片！");
      return;
    } else if (size / 1024 / 1024 > 2) {
      ElMessage.warning("图片大小不超过 2MB！");
      return;
    }
    option.value.imageSrc = URL.createObjectURL(raw);
  } else {
    ElMessage.warning("请重新选择图片！");
  }
};
const startDrawImage = () => {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d");
  const image = new Image();
  image.src = option.value.imageSrc;

  image.onload = () => {
    option.value.imageWidth = image.width;
    option.value.imageHeight = image.height;

    // 根据缩放比例调整 Canvas 大小
    canvas.width = option.value.width * option.value.scale;
    canvas.height = option.value.height * option.value.scale;

    // 根据旋转角度调整 Canvas 大小
    if (option.value.rotation % 180 === 90) {
      canvas.width = option.value.height;
      canvas.height = option.value.width;
    } else {
      canvas.width = option.value.width;
      canvas.height = option.value.height;
    }

    const offsetX = (option.value.width - option.value.cropWidth) / 2;
    const offsetY = (option.value.height - option.value.cropHeight) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 旋转图片 缩放图片
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((option.value.rotation * Math.PI) / 180);
    ctx.scale(option.value.scale, option.value.scale);
    ctx.drawImage(
      image,
      -option.value.imageWidth / 2,
      -option.value.imageHeight / 2
    );
    ctx.restore();

    // 调整裁剪框位置
    option.value.cropStartX = offsetX;
    option.value.cropStartY = offsetY;

    handleCropImage();
  };
};

// 旋转图片
const handleRotate = (dir) => {
  if (dir === "left") {
    option.value.rotation -= 90;
  } else {
    option.value.rotation += 90;
  }
  option.value.rotation %= 360; // 确保旋转角度在 0-360 度之间
  startDrawImage();
};

// 缩放图片
const handleZoom = (dir) => {
  if (dir === "in") {
    option.value.scale += 0.1;
  } else {
    option.value.scale -= 0.1;
    if (
      option.value.imageWidth * option.value.scale <= option.value.cropWidth ||
      option.value.imageHeight * option.value.scale <= option.value.cropHeight
    ) {
      option.value.scale += 0.1;
      return;
    }
  }
  startDrawImage();
};

const handleCropImage = () => {
  const canvas = canvasRef.value;

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = option.value.cropWidth;
  croppedCanvas.height = option.value.cropHeight;

  const croppedCtx = croppedCanvas.getContext("2d");
  croppedCtx.drawImage(
    canvas,
    option.value.cropStartX,
    option.value.cropStartY,
    option.value.cropWidth,
    option.value.cropHeight,
    0,
    0,
    option.value.cropWidth,
    option.value.cropHeight
  );

  option.value.croppedImageSrc = croppedCanvas.toDataURL("image/png");
};

// 开始拖动
const startDrag = (event) => {
  dragOption.isDragging = true;

  dragOption.startX = event.clientX - option.value.cropStartX;
  dragOption.startY = event.clientY - option.value.cropStartY;

  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);
};
// 拖动中
const handleDrag = (event) => {
  if (dragOption.isDragging) {
    const x = event.clientX - dragOption.startX;
    const y = event.clientY - dragOption.startY;
    option.value.cropStartX = x;
    option.value.cropStartY = y;
    dragOption.dragCount++;
  }
};
// 停止拖动
const stopDrag = () => {
  dragOption.isDragging = false;
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
  if (dragOption.dragCount) {
    handleCropImage();
    dragOption.dragCount = 0;
  }
};

// 组件挂载时添加事件监听器
onMounted(() => {
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);
});

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
});
</script>

<style scoped>
.cropper-bg {
  background-color: #eee;
  border: 1px solid #eee;
  color: #bbb;
  overflow: hidden;
}
.cropper-container {
  position: relative;
  .cropper-image {
    opacity: 0;
  }
  canvas {
    position: absolute;
    left: 0;
    top: 0;
  }
}

.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 防止遮罩层阻挡鼠标事件 */
}

.crop-area {
  position: absolute;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7); /* 遮罩层 */
  pointer-events: auto; /* 允许剪裁框区域响应鼠标事件 */
  cursor: move;
  /* transition: all 0.3s ease-in-out; */
}
.cropped-image {
  box-shadow: 0 0 20px 10px rgba(0, 0, 0, 0.1);
  transform: scale(0.5);
}
</style>
