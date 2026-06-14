# 学术盾 (AcadShield) - 可信毕设评审系统 Checklist

## 项目结构
- [x] `acadshield-thesis-review-contract/` 目录存在，包含独立的 `package.json`（Hardhat 项目）
- [x] `acadshield-thesis-review-frontend/` 目录存在，包含独立的 `package.json`（Vite + Vue 3 项目）
- [x] `prototype.html` 静态原型文件存在于根目录
- [x] 两个项目各自独立可运行（各自 `npm install` + `npm run dev/test`）

## 智能合约（acadshield-thesis-review-contract/）
- [x] `contracts/AcadShield.sol` 文件存在且编译通过（`npx hardhat compile`）
- [x] 合约继承 `AccessControl` 和 `ReentrancyGuard`
- [x] 定义 `STUDENT_ROLE`、`REVIEWER_ROLE`、`ADMIN_ROLE` 三个角色常量
- [x] 定义 `ThesisState` 枚举（`NOT_SUBMITTED`、`SUBMITTED`、`UNDER_REVIEW`、`FINALIZED`、`REJECTED`）
- [x] `submitThesis` 函数：仅 STUDENT_ROLE 可调用，支持多次提交，状态从 NOT_SUBMITTED → SUBMITTED
- [x] `reviewThesis` 函数：仅 REVIEWER_ROLE 可调用，开放评审机制，状态从 SUBMITTED → UNDER_REVIEW
- [x] `finalizeGrade` 函数：仅 ADMIN_ROLE 可调用，要求评审存在，状态从 UNDER_REVIEW → FINALIZED
- [x] `rejectThesis` 函数：仅 ADMIN_ROLE 可调用，可从 SUBMITTED 或 UNDER_REVIEW 驳回，状态变为 REJECTED（终态）
- [x] `studentTheses` 映射存储每个学生的论文 ID 数组
- [x] 状态机流转路径正确：NOT_SUBMITTED → SUBMITTED → UNDER_REVIEW → FINALIZED，支持从 SUBMITTED 或 UNDER_REVIEW → REJECTED
- [x] REJECTED 和 FINALIZED 为终态，不允许进一步状态转换
- [x] 关键操作触发事件：`ThesisSubmitted`、`ThesisReviewed`、`GradeFinalized`、`ThesisRejected`
- [x] 查询函数 `getThesisDetails`、`getStudentTheses`、`getThesisCount` 可用
- [x] 链上仅存储轻量级数据（CID/分数/地址/时间戳），不存储文件原文

## 单元测试（acadshield-thesis-review-contract/）
- [x] `test/AcadShield.test.js` 文件存在
- [x] 测试用例数量 ≥ 16 个（实际 19 个）
- [x] 正向用例：学生成功提交论文
- [x] 正向用例：导师成功评审论文
- [x] 正向用例：教务处成功定稿成绩
- [x] 正向用例：完整流程（提交 → 评审 → 定稿）
- [x] 反向用例：非学生角色尝试提交（Expect revert）
- [x] 反向用例：非导师角色尝试评审（Expect revert）
- [x] 反向用例：非管理员角色尝试定稿（Expect revert）
- [x] 反向用例：已定稿论文尝试再次评审（Expect revert）
- [x] 反向用例：未评审完强行定稿（Expect revert）
- [x] 正向用例：管理员驳回 SUBMITTED 状态的论文（Expect state REJECTED）
- [x] 正向用例：管理员驳回 UNDER_REVIEW 状态的论文（Expect state REJECTED）
- [x] 反向用例：非管理员尝试驳回（Expect revert）
- [x] 反向用例：尝试评审 REJECTED 状态的论文（Expect revert）
- [x] 反向用例：尝试定稿 REJECTED 状态的论文（Expect revert）
- [x] 正向用例：学生提交多篇论文（均被跟踪）
- [x] 正向用例：开放评审（任意 REVIEWER_ROLE 可评审）
- [x] 所有测试用例通过（`npx hardhat test`）

## 部署脚本（acadshield-thesis-review-contract/）
- [x] `scripts/deploy.js` 文件存在
- [x] 部署脚本可正常执行（`npx hardhat run scripts/deploy.js`）
- [x] 部署后自动为测试账号分配 STUDENT_ROLE、REVIEWER_ROLE、ADMIN_ROLE
- [x] 部署后将 ABI 导出至前端项目的 `src/abi/AcadShield.json`

## 前端应用（acadshield-thesis-review-frontend/）
- [x] `package.json` 包含 ant-design-vue、@ant-design/web3、ethers、vue-router 依赖
- [x] `main.js` 正确注册 Ant Design 全局组件
- [x] Vue Router 配置四个路由：`/`、`/student`、`/reviewer`、`/admin`
- [x] `composables/useWeb3.js` 封装钱包连接 + 合约交互方法
- [x] `src/abi/AcadShield.json` 合约 ABI 文件存在
- [x] `AppHeader.vue`：品牌标识「盾」+ 导航链接 + 钱包连接
- [x] `HomeView.vue`：Hero 区 + Workflow 三步卡片 + Architecture 架构图（对应原型首页）
- [x] `StudentView.vue`：文件上传区 + 文件元数据 + Steps 进度条 + 提交历史表，支持多次提交（对应原型学生端）
- [x] `ReviewerView.vue`：论文列表 + 滑杆打分面板 + 评语 + 签名提交，开放评审机制（对应原型导师端）
- [x] `AdminView.vue`：五列统计卡 + 论文状态表显示单个评审者信息 + 合约事件日志 + 定稿锁定面板 + 驳回按钮（对应原型教务端）
- [x] `RoleBadge.vue`：SUBMITTED/UNDER_REVIEW/FINALIZED/REJECTED 四种状态徽章组件
- [x] 使用 Ant Design message 处理交易 Loading/Success/Error 状态
- [x] 合约事件监听正常（包含 ThesisRejected 事件），交易成功后页面数据自动刷新
- [x] 链下存文件 + 链上存凭证：文件上传后获得 CID，CID 正确写入合约

## 视觉设计一致性
- [x] 配色方案遵循原型：深墨蓝 `#0F172A` + 暖灰纸色 `#F5F1E8` + 蓝 `#1E3A8A`
- [x] 标题使用衬线字体风格（Noto Serif SC 或 Ant Design 默认中文衬线）
- [x] 状态徽章颜色与原型一致：蓝(提交)/黄(评审中)/绿(定稿)/红(驳回)
- [x] 教务端暗色统计卡样式正确（五列：总提交/待评审/评审中/已定稿/已驳回）
