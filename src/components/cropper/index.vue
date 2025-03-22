<template>
  <div class="image-cropper f_s_b">
    <div>
      <el-upload
        ref="uploadRef"
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
            ref="imageRef"
            @load="handleImageLoad"
          />
          <canvas ref="canvasRef"></canvas>
          <div class="crop-overlay">
            <div class="crop-area" :style="cropAreaStyle"></div>
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
        <el-button type="primary">重新上传</el-button>
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
import { reactive, ref, computed } from "vue";
import {
  Plus,
  Minus,
  RefreshLeft,
  RefreshRight,
  Refresh,
} from "@element-plus/icons-vue";

const option = reactive({
  width: 500, // 容器宽
  height: 500, // 容器高
  imageSrc: null, // 图片地址
  croppedImageSrc: null, // 裁剪后的图片地址
  cropStartX: 0, // 裁剪框起始点 x 坐标
  cropStartY: 0, // 裁剪框起始点 y 坐标
  cropWidth: 300, // 裁剪框宽度
  cropHeight: 400, // 裁剪框高度
  isCropping: false, // 是否正在裁剪
  imageWidth: 0, // 图片原始宽
  imageHeight: 0, // 图片原始高
  rotation: 0, // 旋转角度
  scale: 1, // 缩放比例
});
const imageRef = ref(null);
const canvasRef = ref(null);
const uploadRef = ref(null);

// 计算剪裁框的位置和大小
const cropAreaStyle = computed(() => {
  return {
    width: `${option.cropWidth}px`,
    height: `${option.cropHeight}px`,
    left: `${option.cropStartX}px`,
    top: `${option.cropStartY}px`,
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
    option.imageSrc = URL.createObjectURL(raw);
  } else {
    ElMessage.warning("请重新选择图片！");
  }
};
const handleImageLoad = () => {
  startDrawImage();
};
const startDrawImage = () => {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d");
  const image = new Image();
  image.src = option.imageSrc;

  image.onload = () => {
    option.imageWidth = image.width;
    option.imageHeight = image.height;

    // 根据缩放比例调整 Canvas 大小
    canvas.width = option.width * option.scale;
    canvas.height = option.height * option.scale;

    // 根据旋转角度调整 Canvas 大小
    if (option.rotation % 180 === 90) {
      canvas.width = option.height;
      canvas.height = option.width;
    } else {
      canvas.width = option.width;
      canvas.height = option.height;
    }

    const offsetX = (option.width - option.cropWidth) / 2;
    const offsetY = (option.height - option.cropHeight) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 旋转图片 缩放图片
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((option.rotation * Math.PI) / 180);
    ctx.scale(option.scale, option.scale);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();

    // 调整裁剪框位置
    option.cropStartX = offsetX;
    option.cropStartY = offsetY;

    handleCropImage();
  };
};

// 旋转图片
const handleRotate = (direction) => {
  if (direction === "left") {
    option.rotation -= 90;
  } else {
    option.rotation += 90;
  }
  option.rotation %= 360; // 确保旋转角度在 0-360 度之间
  startDrawImage();
};

// 缩放图片
const handleZoom = (direction) => {
  if (direction === "in") {
    option.scale += 0.1;
  } else {
    option.scale -= 0.1;
    if (
      option.imageWidth * option.scale <= option.cropWidth ||
      option.imageHeight * option.scale <= option.cropHeight
    ) {
      option.scale += 0.1;
      return;
    }
  }
  startDrawImage();
};

const handleCropImage = () => {
  const canvas = canvasRef.value;

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = option.cropWidth;
  croppedCanvas.height = option.cropHeight;

  const croppedCtx = croppedCanvas.getContext("2d");
  croppedCtx.drawImage(
    canvas,
    option.cropStartX,
    option.cropStartY,
    option.cropWidth,
    option.cropHeight,
    0,
    0,
    option.cropWidth,
    option.cropHeight
  );

  option.croppedImageSrc = croppedCanvas.toDataURL("image/png");
};
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
  transition: all 0.3s ease-in-out;
}
.cropped-image {
  box-shadow: 0 0 20px 10px rgba(0, 0, 0, 0.1);
  transform: scale(0.5);
}
</style>
