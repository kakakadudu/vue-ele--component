import "./assets/main.scss";

import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import Selector from "@/components/selector/index.vue";
import App from "./App.vue";

const app = createApp(App);

app.use(ElementPlus);
app.component("Selector", Selector);
app.mount("#app");
