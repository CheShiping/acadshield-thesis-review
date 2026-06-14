# PDF 论文预览功能实现计划

## 一、现状分析与问题定位

### 当前系统状态
- **学生端 `StudentView.vue`**：支持 PDF 上传，但只生成 Mock CID（随机 46 字符字符串），仅将 CID 写入链上合约
- **合约 `AcadShield.sol`**：`Thesis` 结构体存储 `thesisCID`（字符串），不存储 PDF 文件内容
- **导师端 `ReviewerView.vue`**：只显示论文 CID，**没有预览 PDF 的入口**
- **教务端 `AdminView.vue`**：只显示论文 CID，**没有预览 PDF 的入口**
- **文件存储**：上传的 PDF 文件仅存在浏览器内存中，提交后即丢失，无法被其他角色访问

### 核心问题
> 导师和管理员**看不到论文内容**就无法评分、定稿或驳回。链上只存 CID，没有 IPFS 网关，也没有浏览器内的文件持久化机制。

---

## 二、实现方案

### 方案概述
采用 **"浏览器本地存储 + PDF 预览弹窗"** 的方案：

1. **PDF 存储**：学生上传 PDF 后，将文件读取为 `base64 Data URL`，以 `thesisId` 为键存入 `localStorage`
2. **PDF 预览组件**：新增 `PdfPreview.vue` 组件，使用浏览器内置 PDF 渲染（`<iframe>` + Data URL）实现内嵌预览
3. **三端联动**：学生端、导师端、教务端均新增 "预览 PDF" 按钮
4. **兜底机制**：若浏览器中无对应 PDF（跨浏览器场景），提供 "导入 PDF" 功能——允许导师/管理员手动将本地 PDF 与论文 CID 关联

### 为什么选这个方案
- **无需改合约**：合约 CID 机制不变
- **无需后端服务**：纯前端实现，符合本项目定位（链下存文件·链上存凭证）
- **浏览器原生能力**：利用浏览器内置 PDF viewer（Chrome/Edge/Safari 均支持），零额外依赖
- **demo 友好**：在同一浏览器内切换钱包即可完成完整演示流程；不同浏览器可通过 "导入 PDF" 功能补充

### 技术要点
- PDF → base64 Data URL：`FileReader.readAsDataURL()`
- 存储键格式：`acadshield_pdf_<thesisId>` → base64 Data URL
- 文件名记录：`acadshield_pdf_name_<thesisId>` → 原始文件名（用于 UI 展示）
- 预览方式：`<iframe src="data:application/pdf;base64,..." style="width:100%;height:100%">`
- 存储限制：localStorage 通常 ~5MB，**前端提示用户如果超过 4MB 可能需要清理旧文件**

---

## 三、修改文件清单

| # | 文件路径 | 类型 | 修改内容 |
|---|---------|------|---------|
| 1 | `src/components/PdfPreview.vue` | **新建** | 通用 PDF 预览弹窗组件（含下载功能） |
| 2 | `src/views/StudentView.vue` | 修改 | 上传 PDF 时写入 localStorage；历史列表增加 "预览 PDF" 按钮 |
| 3 | `src/views/ReviewerView.vue` | 修改 | 论文列表增加 "预览 PDF" / "导入 PDF" 按钮；评审面板嵌入 PDF 预览区 |
| 4 | `src/views/AdminView.vue` | 修改 | 论文表格每行增加 "预览 PDF" 按钮；支持导入 PDF |

---

## 四、详细实施步骤

### 步骤 1：新建 `PdfPreview.vue` 组件

**组件设计**：
- **Props**：`visible`（是否显示）、`thesisId`（论文编号，用于读取存储）、`cid`（论文 CID，备用）
- **Emits**：`close`、`import-required`（当 localStorage 中无该 PDF 时触发 UI 提示）
- **内部状态**：
  - `pdfDataUrl`（String）——从 localStorage 读取的 PDF Data URL
  - `hasPdf`（Boolean）——是否找到该论文的 PDF 文件
  - `fileName`（String）——原始文件名
- **核心 UI**：
  - 标题栏：`论文 #X - ${fileName}`
  - 主体：`<iframe>` 渲染 PDF（或 "该论文 PDF 未在本浏览器中找到" 提示）
  - 按钮：下载 PDF（`a[download]` 触发）、关闭弹窗
  - 缺失时：显示文件上传按钮（"从本地导入 PDF 以预览"）→ 上传后写入 localStorage → 即时预览

**关键实现**：
```javascript
// 读取：
const key = `acadshield_pdf_${props.thesisId}`
const pdfDataUrl = localStorage.getItem(key)

// 存储：
localStorage.setItem(`acadshield_pdf_${thesisId}`, dataUrl)
localStorage.setItem(`acadshield_pdf_name_${thesisId}`, fileName)

// 预览 iframe：
<iframe :src="pdfDataUrl" style="width:100%;height:70vh;border:none;border-radius:8px"></iframe>
```

### 步骤 2：修改 `StudentView.vue`

**上传流程改造**（`handleBeforeUpload`）：
- 上传时先 `FileReader.readAsDataURL(file)` 获取 Data URL → 存入临时变量 `pendingPdfDataUrl`
- 文件信息展示：文件名、大小、CID（不变）

**提交按钮改造**（`handleSubmit`）：
- 先调用 `submitThesis(mockCID)` → 拿到 tx receipt，其中包含 `thesisId`（从事件 `ThesisSubmitted` 读取，或通过 `getThesisCount()-1` 获取）
- **修改策略**：由于合约返回的是 receipt 而不是 ID，改为**上传前先确定下一个论文 ID = 当前 `getThesisCount()`**，或**从事件日志解析**
- 最简单：使用 `getThesisCount()` 获取 ID，提交后即为该 ID
- 提交成功后：`localStorage.setItem(`acadshield_pdf_${id}`, pendingPdfDataUrl)` 和 `localStorage.setItem(`acadshield_pdf_name_${id}`, file.name)`

**历史表改造**：
- 在 `thesisCID` 列或新增列增加 `按钮："预览 PDF"`
- 点击打开 `PdfPreview` 组件，传入 `record.id`

### 步骤 3：修改 `ReviewerView.vue`

**论文列表改造**：
- 每行增加 `按钮："预览 PDF"`（不可用时置灰并显示 "点击导入 PDF"）

**评审面板改造**（点击「评审」后展开）：
- 在现有「论文信息」下方新增 **PDF 预览区**：一个可折叠的 PDF iframe 预览
- 论文信息区增加：`[预览 PDF]` 按钮（与列表一致）
- 未找到 PDF 时显示：「论文 PDF 未在本浏览器中存储 → [导入 PDF]」按钮

**导入 PDF 功能**（与 `PdfPreview` 组件内逻辑一致）：
- 点击导入 → 文件选择 → `FileReader` → Data URL → 以 `thesisId` 为键存入 localStorage → 自动刷新预览

### 步骤 4：修改 `AdminView.vue`

**论文表格改造**：
- 在 `reviewer/score` 列附近新增 "预览 PDF" 按钮列（与定稿/驳回按钮并排）
- 点击打开 `PdfPreview` 组件，传入 `record.id`
- 提供与 ReviewerView 相同的 "导入 PDF" 兜底机制

---

## 五、数据结构约定

### localStorage 键值
```
acadshield_pdf_<thesisId>    →  data:application/pdf;base64,...   (PDF 内容)
acadshield_pdf_name_<thesisId> → "论文题目.pdf"                      (原始文件名)
```

### 组件 Props/Events 契约
```
PdfPreview.vue
  props: {
    visible: Boolean,
    thesisId: [Number, String],
    cid: String
  }
  emits: {
    close: () => true,
    loaded: (hasPdf: Boolean) => true   // 告知父组件是否成功找到 PDF
  }
```

---

## 六、依赖与注意事项

### 无需新增依赖
- 不引入第三方 PDF 库（如 pdf.js），使用浏览器原生 `<iframe>` 解析 `data:` URL
- 利用 Vue 3 Composition API + Ant Design Vue（项目已有）

### 浏览器兼容考虑
- Chrome/Edge 内置 PDF Viewer ✅
- Firefox 内置 PDF Viewer ✅  
- Safari 支持 data URL iframe ✅
- 测试环境为现代浏览器，无需降级

### localStorage 容量限制
- 默认每域名 ~5MB；论文 PDF 建议不超过 3-4MB
- 存储前检测 `QuotaExceededError` → 前端提示：「文件过大，请清除浏览器缓存或使用更小的 PDF」
- 学生切换钱包后数据仍在（同一浏览器），不同浏览器需重新上传/导入

---

## 七、预期最终效果

| 角色 | 功能 | 预期效果 |
|------|------|---------|
| **学生** | 上传论文 | 上传后论文 PDF 保存在浏览器；提交后可从历史列表随时预览 |
| **导师** | 评审论文 | 在论文列表和评审面板均可点击 "预览 PDF" 打开论文内容阅读；**读完后才能评分提交** |
| **教务** | 定稿驳回 | 论文表格每行有 "预览 PDF" 按钮；可在定稿/驳回前阅读论文 |
| **所有角色** | 跨浏览器兜底 | 若浏览器无该 PDF 文件 → 提示手动导入；导入后立即在当前浏览器可预览 |

---

## 八、风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|---------|
| localStorage 容量不足 | PDF 存储失败 | 上传前检查大小；超限时提示用户；提供清除旧文件的便捷入口 |
| 同一浏览器多钱包切换的数据可见性 | 不同钱包的论文互相可见 | 预期行为：演示/评审/教务在同一浏览器切换钱包时正好需要看到彼此的 PDF；若需隔离可加 address 前缀 |
| PDF 内容与 CID 不一致 | 理论上导入错误 PDF 可能 | UI 层仅做预览，链上数据保持不变；导入时提示 "仅用于本地预览，不影响链上 CID 记录" |
