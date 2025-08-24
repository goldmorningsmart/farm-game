<template>
  <div class="flex h-screen items-center justify-center" style="background: url('./start.png') center/cover no-repeat">
    <el-card class="w-96 shadow-2xl rounded-[2rem] overflow-hidden bg-white/30 backdrop-blur-lg border border-white/20">
      <h2 class="text-xl font-bold mb-6 text-center">欢迎来到Vue农场</h2>
      <el-form :model="form" ref="formRef" label-width="80px" status-icon>
        <el-form-item label="用户名" prop="username" :rules="[{ required: true, message: '请输入用户名', trigger: 'blur' }]">
          <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password" :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]">
          <el-input v-model="form.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>

      </el-form>
      <el-form-item>
        <el-checkbox v-model="rememberMe">记住我</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="success" class="w-full items-center" @click="handleLogin">登录</el-button>
      </el-form-item>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useGameStore } from "@/stores/game";
import { ElMessage } from "element-plus";
import { saveManager } from "@/stores/saveManager.js";
import config from "@/config/index.js";
import { initDebug } from '@/game/debug'

const router = useRouter();
const game = useGameStore();
const formRef = ref(null);

const form = ref({
  username: "",
  password: ""
});

const rememberMe = ref(false);

// 页面加载时，从 localStorage 读取
onMounted(() => {
  const savedUser = localStorage.getItem("farmUser");
  const savedPass = localStorage.getItem("farmPass");
  if (savedUser) form.value.username = savedUser;
  if (savedPass) {
    form.value.password = savedPass;
    rememberMe.value = true;
  }
});

const handleLogin = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      const res = await fetch(config.apiUrl + "api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.value),
      });

      const data = await res.json();

      if (data.success) {
        ElMessage.success("登录成功");

        // 保存用户名和密码
        if (rememberMe.value) {
          localStorage.setItem("farmUser", form.value.username);
          localStorage.setItem("farmPass", form.value.password);
        } else {
          localStorage.removeItem("farmUser");
          localStorage.removeItem("farmPass");
        }

        game.login(form.value.username);
        await saveManager.load();
        initDebug()
        router.push("/farm");
      } else {
        ElMessage.error(data.message || "登录失败");
      }
    } catch (e) {
      ElMessage.error("服务器错误");
    }
  });
};
</script>
