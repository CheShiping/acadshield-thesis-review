# Tasks

## 阶段一：基础设施搭建与合约开发

- [x] Task 1: 初始化合约项目 `acadshield-thesis-review-contract/`
  - [x] SubTask 1.1: 创建目录 `acadshield-thesis-review-contract/`，初始化 `package.json`（独立 Hardhat 项目）
  - [x] SubTask 1.2: 安装 hardhat、@openzeppelin/contracts、@nomicfoundation/hardhat-toolbox
  - [x] SubTask 1.3: 创建 `hardhat.config.js`，配置本地测试网（Hardhat Network）
  - [x] SubTask 1.4: 创建子目录 `contracts/`、`test/`、`scripts/`

- [x] Task 2: 编写 AcadShield.sol 智能合约
  - [x] SubTask 2.1: 定义角色常量（`STUDENT_ROLE`、`REVIEWER_ROLE`、`ADMIN_ROLE`）和状态枚举（`NOT_SUBMITTED`、`SUBMITTED`、`UNDER_REVIEW`、`FINALIZED`、`REJECTED`）
  - [x] SubTask 2.2: 实现数据结构（`Thesis` struct、映射 `theses`、`studentTheses` 映射存储每个学生的论文 ID 数组）
  - [x] SubTask 2.3: 实现构造函数，授予部署者 `ADMIN_ROLE`，预留角色分配接口
  - [x] SubTask 2.4: 实现 `submitThesis(string thesisCID)` 函数，支持多次提交，每次提交生成唯一 thesisId
  - [x] SubTask 2.5: 实现 `reviewThesis(uint256 thesisId, uint8 score, string reviewCID)` 函数，开放评审机制（任意 REVIEWER_ROLE 可评审）
  - [x] SubTask 2.6: 实现 `finalizeGrade(uint256 thesisId)` 函数，要求评审存在（reviewer != address(0)）
  - [x] SubTask 2.7: 实现 `rejectThesis(uint256 thesisId)` 函数，可从 SUBMITTED 或 UNDER_REVIEW 状态驳回，REJECTED 为终态
  - [x] SubTask 2.8: 实现查询函数 `getThesisDetails(uint256 thesisId)`、`getStudentTheses(address student)` 和 `getThesisCount()`
  - [x] SubTask 2.9: 定义事件 `ThesisSubmitted`、`ThesisReviewed`、`GradeFinalized`、`ThesisRejected`

- [x] Task 3: 编写自动化部署脚本
  - [x] SubTask 3.1: 创建 `scripts/deploy.js`，部署 AcadShield 合约
  - [x] SubTask 3.2: 部署后自动为测试账号分配 STUDENT_ROLE、REVIEWER_ROLE、ADMIN_ROLE
  - [x] SubTask 3.3: 部署后将 ABI 导出至 `../acadshield-thesis-review-frontend/src/abi/AcadShield.json`

## 阶段二：单元测试

- [x] Task 4: 编写 AcadShield 合约单元测试（≥16 个用例）
  - [x] SubTask 4.1: 正向用例 - 学生成功提交论文
  - [x] SubTask 4.2: 正向用例 - 导师成功评审论文
  - [x] SubTask 4.3: 正向用例 - 教务处成功定稿成绩
  - [x] SubTask 4.4: 正向用例 - 完整流程（提交 → 评审 → 定稿）
  - [x] SubTask 4.5: 反向用例 - 非学生角色尝试提交（Expect revert）
  - [x] SubTask 4.6: 反向用例 - 非导师角色尝试评审（Expect revert）
  - [x] SubTask 4.7: 反向用例 - 非管理员角色尝试定稿（Expect revert）
  - [x] SubTask 4.8: 反向用例 - 已定稿论文尝试再次评审（Expect revert）
  - [x] SubTask 4.9: 反向用例 - 未评审完强行定稿（Expect revert）
  - [x] SubTask 4.10: 正向用例 - 管理员驳回 SUBMITTED 状态的论文（Expect state REJECTED）
  - [x] SubTask 4.11: 正向用例 - 管理员驳回 UNDER_REVIEW 状态的论文（Expect state REJECTED）
  - [x] SubTask 4.12: 反向用例 - 非管理员尝试驳回（Expect revert）
  - [x] SubTask 4.13: 反向用例 - 尝试评审 REJECTED 状态的论文（Expect revert）
  - [x] SubTask 4.14: 反向用例 - 尝试定稿 REJECTED 状态的论文（Expect revert）
  - [x] SubTask 4.15: 正向用例 - 学生提交多篇论文（均被跟踪）
  - [x] SubTask 4.16: 正向用例 - 开放评审（任意 REVIEWER_ROLE 可评审）

## 阶段三：前端开发

- [x] Task 5: 初始化前端项目 `acadshield-thesis-review-frontend/`
  - [x] SubTask 5.1: 创建目录 `acadshield-thesis-review-frontend/`，用 Vite 初始化 Vue 3 项目
  - [x] SubTask 5.2: 安装 ant-design-vue、@ant-design/web3、ethers、vue-router
  - [x] SubTask 5.3: 配置 `main.js` 注册 Ant Design 全局组件
  - [x] SubTask 5.4: 配置 Vue Router 四个路由（`/`、`/student`、`/reviewer`、`/admin`）
  - [x] SubTask 5.5: 创建 `composables/useWeb3.js`，封装钱包连接 + 合约交互方法
  - [x] SubTask 5.6: 创建 `App.vue` 主布局（Ant Design Layout + AppHeader）
  - [x] SubTask 5.7: 将合约 ABI 文件放入 `src/abi/AcadShield.json`（需先部署合约）

- [x] Task 6: 实现前端页面和组件
  - [x] SubTask 6.1: 创建 `AppHeader.vue`（品牌标识 + 导航链接 + Ant Design Web3 Connector 钱包连接）
  - [x] SubTask 6.2: 创建 `HomeView.vue`（Hero 区 + Workflow 三步卡片 + Architecture 架构图）—— 对应原型首页
  - [x] SubTask 6.3: 创建 `StudentView.vue`（文件上传区 + 文件元数据 + Steps 进度条 + 提交历史表，支持多次提交）—— 对应原型学生端
  - [x] SubTask 6.4: 创建 `ReviewerView.vue`（论文列表 + 滑杆打分面板 + 评语 + 签名提交，开放评审机制）—— 对应原型导师端
  - [x] SubTask 6.5: 创建 `AdminView.vue`（五列统计卡 + 论文状态表显示单个评审者信息 + 合约事件日志 + 定稿锁定面板 + 驳回按钮）—— 对应原型教务端
  - [x] SubTask 6.6: 创建 `RoleBadge.vue` 角色标识组件（SUBMITTED/UNDER_REVIEW/FINALIZED/REJECTED 四种状态徽章）
  - [x] SubTask 6.7: 集成 ethers.js 调用合约方法，使用 Ant Design message 处理交易状态
  - [x] SubTask 6.8: 监听合约事件（ThesisSubmitted、ThesisReviewed、GradeFinalized、ThesisRejected），自动刷新页面数据

## 阶段四：联调与交付

- [x] Task 7: 端到端联调验证
  - [x] SubTask 7.1: 在合约项目中启动本地 Hardhat 节点（`npx hardhat node`）
  - [x] SubTask 7.2: 部署合约到本地网络，将 ABI 同步至前端项目
  - [x] SubTask 7.3: 前端连接本地网络，测试完整业务流程
  - [x] SubTask 7.4: 修复交互 Bug，确保事件监听正常工作

- [x] Task 8: 项目文档与结构整理
  - [x] SubTask 8.1: 确保两个项目各自独立可运行（各自 `npm install` + `npm run dev/test`）
  - [x] SubTask 8.2: 编写 README.md（架构图、角色说明、快速启动命令）

---

# Task Dependencies

- Task 2 (合约编写) 依赖 Task 1 (合约项目初始化)
- Task 3 (部署脚本) 依赖 Task 2 (合约编写)
- Task 4 (单元测试) 依赖 Task 2 (合约编写)
- Task 5 (前端初始化) 可与 Task 1 并行（两个项目独立）
- Task 6 (前端页面) 依赖 Task 5 (前端初始化) 和 Task 2 (合约 ABI)
- Task 7 (联调验证) 依赖 Task 3、Task 4、Task 6
- Task 8 (文档整理) 依赖 Task 7 (联调验证)

# 并行策略
- Task 1~4 (合约侧) 和 Task 5~6 (前端侧) 可并行开发
- Task 3 和 Task 4 可并行（部署脚本 vs 单元测试互不阻塞）
- Task 6 内部各视图组件可并行开发
