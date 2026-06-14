# 学术盾 (AcadShield) - 可信毕设评审系统 Spec

## Why

传统高校毕设评审存在三大痛点：论文提交时间易被事后篡改（争议）、导师打分过程不透明且评语易丢失、最终成绩在教务处数据库中存在被内部人员越权修改的风险。本项目利用区块链构建一个不可篡改、多方共识、权限分明的可信评审平台。

## What Changes

- 初始化 Hardhat + Solidity 项目，集成 OpenZeppelin Contracts
- 实现 `AcadShield` 智能合约，包含四状态机（含 REJECTED）、RBAC 权限控制、提交/评审/定稿/驳回核心功能
- 每篇论文仅接受一位评审（first-come-first-served），任何 REVIEWER_ROLE 持有者均可评审任何 SUBMITTED 论文（开放评审）
- 链上仅存储单个 `uint8` 总分，四维评分（选题/创新/实现/写作）为前端 UI 辅助，不写入合约
- 学生可提交多篇论文（`mapping(address => uint256[])`），每篇获得唯一 `thesisId`
- 使用 Vite + Vue 3 (Composition API) 构建前端界面，采用 Ant Design of Vue 组件库打造优美 UI
- 使用 Ant Design Web3 组件连接钱包，简化 Web3 交互
- 采用"链下存文件 + 链上存凭证"分离存储策略：论文 PDF/评语等大文件存储至 IPFS（或本地模拟），链上仅存储文件哈希（CID）和元数据
- 实现学生端、导师端、教务处端三个角色视图 + 首页 Hero 展示
- 编写完整单元测试（≥16 个用例）
- 提供自动化部署脚本，支持本地测试网部署

## Impact

- **Affected specs**: 全新项目，无既有规范影响
- **Affected code**:
  - `acadshield-thesis-review-contract/` - 智能合约项目（Hardhat + Solidity）
  - `acadshield-thesis-review-frontend/` - 前端项目（Vue 3 + Ant Design）

## 项目结构（双文件夹独立结构）

```
acadshield-thesis-review/
├── prototype.html                              # 静态原型（设计参考）
│
├── acadshield-thesis-review-contract/          # ===== 合约项目 =====
│   ├── package.json                            # Hardhat 项目配置
│   ├── hardhat.config.js
│   ├── contracts/
│   │   └── AcadShield.sol                      # 核心合约
│   ├── test/
│   │   └── AcadShield.test.js                  # 单元测试
│   └── scripts/
│       └── deploy.js                           # 部署脚本
│
└── acadshield-thesis-review-frontend/          # ===== 前端项目 =====
    ├── package.json                            # Vite + Vue 3 项目配置
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.vue                             # 主布局（Ant Design Layout）
        ├── main.js                             # 入口（注册 Ant Design）
        ├── router/
        │   └── index.js                        # Vue Router 四个路由
        ├── composables/
        │   └── useWeb3.js                      # 钱包连接 + 合约交互封装
        ├── abi/
        │   └── AcadShield.json                 # 合约编译产物 ABI
        ├── views/
        │   ├── HomeView.vue                    # 首页 Hero + Workflow + Architecture
        │   ├── StudentView.vue                 # 学生端
        │   ├── ReviewerView.vue                # 导师端
        │   └── AdminView.vue                   # 教务端
        └── components/
            ├── AppHeader.vue                   # 顶部导航 + 钱包连接
            └── RoleBadge.vue                   # 角色标识组件
```

---

## 视觉设计规范（基于原型 prototype.html）

### 设计语言

- **调性**：学术、克制、可信 —— 严肃但不冷漠
- **配色**：深墨蓝 `#0F172A` (主色) + 暖灰纸色 `#F5F1E8` (背景) + 蓝 `#1E3A8A` (强调)
- **字体**：Noto Serif SC（中文衬线，用于标题/数据）+ Inter（拉丁文/正文）+ SF Mono（等宽，用于哈希/地址）
- **布局**：无卡片化堆叠，用排版和分隔线构建层次；section 间用 `border-bottom` 分隔

### 四个页面视图

#### 1. 首页 (HomeView)

- Hero 区：品牌标识「盾」+ 主标题「把毕设评审写进不可篡改的区块」+ CTA 按钮
- 底部 meta 三列：已存证论文数 / 评审导师数 / 平均定稿耗时
- Workflow 区：三步卡片（学生提交 → 导师评审 → 教务锁定），每步附合约函数签名
- Architecture 区：ASCII 架构图展示前端层 → 合约层 → 文件层三层结构

#### 2. 学生端 (StudentView)

- 左栏：文件上传区（拖拽/点击）+ 文件元数据（文件名/大小/SHA-256/CID）+ 提交按钮
- 左栏下方：提交历史表（编号/论文/状态徽章/分数/区块号）
- 右栏：Steps 进度条（IPFS上传 → MetaMask签名 → 导师评审 → 教务锁定）
- 右栏底部：「链下存文件·链上存凭证」说明卡片

#### 3. 导师端 (ReviewerView)

- 顶部：论文列表（序号/标题/学生信息/CID/状态徽章/操作按钮）
- 点击论文后滚动到打分面板
- 打分面板：左侧大分数展示（96px serif 数字）+ 右侧滑杆总分 + 四维评分（选题/创新/实现/写作）+ 评语 textarea
- 底部：签名提交 + 保存草稿按钮

#### 4. 教务端 (AdminView)

- 顶部五列统计卡：总提交数 / 待评审 / 评审中 / 已定稿 / 已驳回（暗色反色卡）
- 左栏：全部论文表（编号/学生论文/状态/单个评审者信息/分数/操作按钮）
- 左栏底部：Recent Contract Events 终端流（深色背景 monospace），包含 ThesisRejected 事件
- 右栏侧边面板：定稿锁定区（论文信息 + 评审者地址 + 分数 + 评语链接 + 锁定按钮 + 驳回按钮）

### 状态徽章规范

| 状态 | 颜色 | 背景 | 文字 |
|------|------|------|------|
| SUBMITTED | 蓝 | `#DBEAFE` | `#1E40AF` |
| UNDER_REVIEW | 黄 | `#FEF3C7` | `#92400E` |
| FINALIZED | 绿 | `#DCFCE7` | `#166534` |
| REJECTED | 红 | `#FEE2E2` | `#991B1B` |

---

## ADDED Requirements

### Requirement: 智能合约核心逻辑

系统 SHALL 提供 `AcadShield` 智能合约，继承 `AccessControl` 和 `ReentrancyGuard`。

#### Scenario: 状态机流转（4状态）

- **GIVEN** 论文处于 `NOT_SUBMITTED` 状态
- **WHEN** 学生调用 `submitThesis(string thesisCID)`
- **THEN** 论文状态变更为 `SUBMITTED`，触发 `ThesisSubmitted` 事件

#### Scenario: 评审流程（开放评审）

- **GIVEN** 论文处于 `SUBMITTED` 状态
- **WHEN** 任意持有 `REVIEWER_ROLE` 的导师调用 `reviewThesis(uint256 thesisId, uint8 score, string reviewCID)`
- **THEN** 记录评分和评语CID，状态变更为 `UNDER_REVIEW`，触发 `ThesisReviewed` 事件

#### Scenario: 定稿锁定

- **GIVEN** 论文处于 `UNDER_REVIEW` 状态且评审存在（reviewer != address(0)）
- **WHEN** 教务处调用 `finalizeGrade(uint256 thesisId)`
- **THEN** 状态变更为 `FINALIZED`，触发 `GradeFinalized` 事件，成绩不可修改

#### Scenario: 驳回论文

- **GIVEN** 论文处于 `SUBMITTED` 或 `UNDER_REVIEW` 状态
- **WHEN** 教务处调用 `rejectThesis(uint256 thesisId)`
- **THEN** 状态变更为 `REJECTED`，触发 `ThesisRejected` 事件，该状态为终态不可变更

#### Scenario: 多次提交

- **GIVEN** 学生已有提交记录
- **WHEN** 学生再次调用 `submitThesis`
- **THEN** 创建新论文记录，thesisId 递增，所有论文ID存储在 `studentTheses[address]` 数组中

### Requirement: RBAC 权限控制

基于 OpenZeppelin `AccessControl` 实现三种角色：`STUDENT_ROLE`、`REVIEWER_ROLE`、`ADMIN_ROLE`。

#### Scenario: 角色隔离

- **WHEN** 非学生角色调用 `submitThesis`
- **THEN** 交易回滚，返回权限不足错误

#### Scenario: 多次提交支持

- **GIVEN** 学生已提交论文
- **WHEN** 同一学生再次调用 `submitThesis`
- **THEN** 创建新论文记录，允许同一学生提交多篇论文

### Requirement: 链下存文件 + 链上存凭证（分离存储策略）

区块链不适合直接存储大体积文件（会导致 Gas 费极高且效率低下），系统 SHALL 采用分离存储策略：

- **链下存储**：论文 PDF、长篇评语等原始文件上传至 IPFS（或本地模拟），获取唯一 CID（内容标识符）
- **链上存证**：智能合约仅存储轻量级元数据（`string thesisCID`、`uint8 score`、`address submitter`、`uint256 timestamp`），通过哈希比对确保链下文件未被篡改

#### Scenario: 文件上传与哈希存证

- **WHEN** 学生上传论文 PDF
- **THEN** 文件存储至 IPFS 获得 CID，CID 写入智能合约作为不可篡改的存证

#### Scenario: 数据完整性验证

- **GIVEN** 论文已提交
- **WHEN** 查询论文详情
- **THEN** 返回 `thesisCID`、`submitter`、`timestamp`、`state` 等轻量级数据，可通过 CID 反查链下文件并比对哈希

### Requirement: 前端多角色视图

使用 Vue 3 组合式 API + Ant Design of Vue 构建前端，采用 Ant Design Web3 组件实现钱包连接，支持首页、学生端、导师端、教务端四种视图。

#### Scenario: 首页展示

- **WHEN** 用户首次访问
- **THEN** 展示 Hero 区（品牌 + 主标题 + CTA）+ Workflow 三步说明 + Architecture 架构图

#### Scenario: 钱包连接

- **WHEN** 用户点击「连接 MetaMask」
- **THEN** 通过 Ant Design Web3 的 `Connector` 组件一键连接 MetaMask 钱包，自动识别用户角色

#### Scenario: 学生端功能

- **WHEN** 学生连接钱包
- **THEN** 显示论文上传表单（支持文件选择 + IPFS 模拟上传）+ Steps 进度条 + 提交历史表

#### Scenario: 导师端功能

- **WHEN** 导师连接钱包
- **THEN** 显示待审论文列表 + 打分面板（滑杆评分 + 评语 + 签名提交）

#### Scenario: 教务端功能

- **WHEN** 管理员连接钱包
- **THEN** 显示全局评审大盘：
  - 四列统计卡：总提交数 / 待评审 / 评审中 / 已定稿 + 已驳回计数
  - 论文状态表：显示单个评审者信息（地址 + 分数 + 评语链接）
  - 合约事件日志：包含 ThesisSubmitted、ThesisReviewed、GradeFinalized、ThesisRejected 事件
  - 侧边面板：定稿锁定 + 驳回按钮（终态操作）

### Requirement: 部署与测试

提供自动化部署脚本和完整单元测试。

#### Scenario: 部署脚本

- **WHEN** 执行 `npx hardhat run scripts/deploy.js`
- **THEN** 合约部署成功，自动为测试账号分配角色

#### Scenario: 单元测试覆盖

- **WHEN** 执行 `npx hardhat test`
- **THEN** 所有 ≥16 个测试用例通过（含正向和反向用例，覆盖 REJECTED 状态和多次提交场景）

---

## MODIFIED Requirements

### Requirement: 智能合约核心逻辑（精炼更新）

#### Scenario: 多次提交支持

- **GIVEN** 学生已提交论文
- **WHEN** 同一学生再次调用 `submitThesis`
- **THEN** 创建新论文记录，允许同一学生提交多篇论文，所有论文 ID 存储在 `studentTheses[address]` 数组中

#### Scenario: 开放评审机制

- **GIVEN** 论文处于 `SUBMITTED` 状态
- **WHEN** 任意持有 `REVIEWER_ROLE` 的导师调用 `reviewThesis`
- **THEN** 第一个提交评审的导师获得该论文的评审权，状态变更为 `UNDER_REVIEW`

### Requirement: 前端多角色视图（精炼更新）

#### Scenario: 教务端功能增强

- **WHEN** 管理员连接钱包
- **THEN** 显示全局评审大盘：
  - 五列统计卡：总提交数 / 待评审 / 评审中 / 已定稿 / 已驳回
  - 论文状态表：显示单个评审者信息（评审者地址 + 分数 + 评语链接）
  - 合约事件日志：包含 ThesisSubmitted、ThesisReviewed、GradeFinalized、ThesisRejected 事件
  - 侧边面板：定稿锁定 + 驳回按钮（终态操作）

## REMOVED Requirements

无（全新项目）

---

## 技术栈
- **合约项目** (`acadshield-thesis-review-contract/`): Solidity + Hardhat + OpenZeppelin Contracts (AccessControl, ReentrancyGuard) + Chai 测试
- **前端项目** (`acadshield-thesis-review-frontend/`): Vite + Vue 3 (Composition API) + Ant Design of Vue + Ant Design Web3 + Vue Router + ethers.js v6
- **链下存储**: IPFS（开发阶段本地模拟 CID 生成）
- **部署**: 合约项目内 `scripts/deploy.js`
- **原型参考**: `prototype.html`（静态 HTML，含四个角色视图的完整布局设计）

---

## 精炼设计更新 (2026-06-14)

### 变更摘要

| 领域 | 原始设计 | 精炼设计 |
|------|----------|----------|
| 每篇论文评审数 | 隐含单个 | 明确单个 — 一个评审者 |
| 评审分配 | 未定义 | 开放 — 任意 REVIEWER_ROLE 可评审任意 SUBMITTED 论文 |
| 评分模型 | 单个 uint8 分数 | 链上单个 uint8 分数，4 维度仅为 UI 提示 |
| 学生提交次数 | 单次 (mapping(address => bool)) | 多次 (mapping(address => uint256[])) |
| 状态机 | 3 状态: SUBMITTED → UNDER_REVIEW → FINALIZED | 4 状态: 增加 REJECTED (从 SUBMITTED 或 UNDER_REVIEW) |
| 驳回功能 | 不支持 | 管理员可驳回 — 终态，从 SUBMITTED 或 UNDER_REVIEW |

### 1. 状态机（4 状态）

```
NOT_SUBMITTED → SUBMITTED → UNDER_REVIEW → FINALIZED
                     ↓              ↓
                  REJECTED       REJECTED
                  (permanent)    (permanent)
```

#### 状态转换

| 函数 | 从 | 到 | 角色 |
|------|-----|-----|------|
| `submitThesis(string thesisCID)` | NOT_SUBMITTED | SUBMITTED | STUDENT_ROLE |
| `reviewThesis(uint256 id, uint8 score, string reviewCID)` | SUBMITTED | UNDER_REVIEW | REVIEWER_ROLE |
| `finalizeGrade(uint256 id)` | UNDER_REVIEW | FINALIZED | ADMIN_ROLE |
| `rejectThesis(uint256 id)` | SUBMITTED 或 UNDER_REVIEW | REJECTED | ADMIN_ROLE |

#### 规则
- 学生可提交多篇论文（每篇获得唯一 thesisId）
- 任意 REVIEWER_ROLE 持有者可评审任意 SUBMITTED 论文（开放评审）
- 每篇论文仅一次评审机会（先到先得）
- REJECTED 为终态 — 不允许进一步状态转换
- FINALIZED 为终态 — 不允许进一步状态转换
- `finalizeGrade` 要求评审已存在（score > 0 或 reviewer != address(0)）

### 2. 合约数据结构

#### ThesisState 枚举
```solidity
enum ThesisState {
    NOT_SUBMITTED,  // 0 — 默认，不存储
    SUBMITTED,      // 1
    UNDER_REVIEW,   // 2
    FINALIZED,      // 3
    REJECTED        // 4
}
```

#### Thesis 结构体
```solidity
struct Thesis {
    uint256 id;
    address submitter;       // 学生地址
    string thesisCID;        // 论文 PDF 的 IPFS CID
    ThesisState state;
    uint8 score;             // 评审分数 (0-100)，评审前为 0
    address reviewer;        // 评分的评审者，评审前为 address(0)
    string reviewCID;        // 评审文档的 IPFS CID
    uint256 submittedAt;     // 区块时间戳
    uint256 reviewedAt;      // 区块时间戳，评审前为 0
}
```

#### 映射与状态
```solidity
mapping(uint256 => Thesis) public theses;
mapping(address => uint256[]) public studentTheses;
uint256 public nextThesisId;
```

### 3. 合约函数

#### 核心函数

- `submitThesis(string memory thesisCID)` — 创建新 Thesis，状态 SUBMITTED，追加 thesisId 到 studentTheses[msg.sender]
- `reviewThesis(uint256 thesisId, uint8 score, string memory reviewCID)` — 设置评分/评审者/CID/时间，状态改为 UNDER_REVIEW
- `finalizeGrade(uint256 thesisId)` — 状态改为 FINALIZED，要求评审存在
- `rejectThesis(uint256 thesisId)` — 状态改为 REJECTED，可从 SUBMITTED 或 UNDER_REVIEW 调用

#### 查询函数

- `getThesisDetails(uint256 thesisId)` — 返回 Thesis 详情
- `getStudentTheses(address student)` — 返回学生的所有论文 ID
- `getThesisCount()` — 返回论文总数

### 4. 事件

```solidity
event ThesisSubmitted(uint256 indexed thesisId, address indexed submitter, string thesisCID, uint256 timestamp);
event ThesisReviewed(uint256 indexed thesisId, address indexed reviewer, uint8 score, string reviewCID);
event GradeFinalized(uint256 indexed thesisId, uint8 finalScore);
event ThesisRejected(uint256 indexed thesisId, address indexed admin, uint256 timestamp);
```

### 5. RBAC（不变）

三种角色通过 OpenZeppelin AccessControl 实现：
- STUDENT_ROLE — 可调用 submitThesis
- REVIEWER_ROLE — 可调用 reviewThesis
- ADMIN_ROLE — 可调用 finalizeGrade、rejectThesis，并授予/撤销角色

### 6. 前端视图变更

#### AdminView 调整

**移除：**
- 3 评审者平均分面板（导师 A/B/C 分数及平均分）
- 表格中的 "X/3 导师" 计数

**替换为：**
- 单个评审者显示：评审者地址 + 分数 + 评语链接
- 示例："Reviewed by: 0xAbCd...1234 · Score: 88 · Review: QmYk4...1FdA"

**新增：**
- 驳回按钮（与定稿按钮并列）
- 合约事件日志中的 ThesisRejected 事件
- REJECTED 状态徽章（红色: #FEE2E2 / #991B1B）

**统计卡调整：**
- "待评审" = SUBMITTED 计数
- "评审中" = UNDER_REVIEW 计数
- "已定稿" = FINALIZED 计数
- 新增 "已驳回" = REJECTED 计数

#### StudentView — 无变更
- 多次提交已在原型中展示 ✓
- 进度条不变
- 文件上传 + IPFS 模拟不变

#### ReviewerView — 无变更
- 单分数滑杆 (0-100) ✓
- 4 维度滑杆保留为 UI 提示（不存储到链上）
- 评审文本 → IPFS → CID 上链 ✓

#### HomeView — 无变更

### 7. IPFS 模拟（开发阶段）

开发阶段 IPFS 本地模拟：
- 使用 Qm + 随机 base58 字符串生成模拟 CID
- 不实际上传文件内容
- CID 直接传递给合约
- 生产环境使用真实 IPFS 节点或 Pinata/web3.storage

### 8. 单元测试更新

原始 10 个测试用例保留有效。新增 REJECTED 状态测试：

| # | 测试 | 类型 |
|---|------|------|
| 11 | 管理员驳回 SUBMITTED 状态的论文 | 正向 |
| 12 | 管理员驳回 UNDER_REVIEW 状态的论文 | 正向 |
| 13 | 非管理员尝试驳回（预期回滚） | 反向 |
| 14 | 尝试评审 REJECTED 状态的论文（预期回滚） | 反向 |
| 15 | 尝试定稿 REJECTED 状态的论文（预期回滚） | 反向 |
| 16 | 学生提交多篇论文 | 正向 |

总计：≥16 个测试用例（从 ≥8 个增加）

### 9. 更新清单

#### 智能合约
- [ ] rejectThesis 函数：ADMIN_ROLE 可从 SUBMITTED 或 UNDER_REVIEW 驳回
- [ ] REJECTED 状态为终态 — 不允许进一步状态转换
- [ ] studentTheses 映射存储每个学生的论文 ID 数组
- [ ] 驳回时触发 ThesisRejected 事件

#### 单元测试
- [ ] 管理员驳回 SUBMITTED 论文（预期状态 REJECTED）
- [ ] 管理员驳回 UNDER_REVIEW 论文（预期状态 REJECTED）
- [ ] 非管理员驳回尝试（预期回滚）
- [ ] 评审 REJECTED 论文（预期回滚）
- [ ] 定稿 REJECTED 论文（预期回滚）
- [ ] 学生提交多篇论文（均被跟踪）

#### 前端
- [ ] Admin 视图显示单个评审者信息（非 3 评审者平均分）
- [ ] Admin 视图包含驳回按钮
- [ ] REJECTED 状态徽章使用红色样式
- [ ] 事件日志显示 ThesisRejected 事件
