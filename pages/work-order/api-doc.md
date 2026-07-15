# 入户安检v0.2接口文档

# 接口规范说明

**HTTP方法**

| GET  | 查询数据 |
| ---- | -------- |
| POST | 新增数据 |
| POST | 更新数据 |
| POST | 删除数据 |

**状态码规范**

| 200 | 成功                     |
| --- | ------------------------ |
| 400 | 请求参数不正确           |
| 401 | 账号未登录               |
| 403 | 没有该操作权限           |
| 404 | 请求未找到               |
| 405 | 请求方法不正确           |
| 423 | 请求失败，请稍后重试     |
| 429 | 请求过于频繁，请稍后重试 |
| 500 | 系统异常                 |
| 501 | 功能未实现/未开启        |
| 502 | 错误的配置项             |

**请求头**

```json
Content-Type: application/json
```

# APP端

## 1：查询当前安检员工单列表

● 接口描述

APP端查询当前登录安检员被指派的工单。后端会强制使用当前登录用户ID作为 `inspectorId`，APP端不需要也不能传其他安检员ID查询。

● 请求地址

GET `/inspection/app/workOrder/v0.2/list`

● 请求参数

| 字段名        | 类型    | 必填 | 说明                                                  |
| ------------- | ------- | ---- | ----------------------------------------------------- |
| status        | Integer | 否   | 工单状态：1未开始，2进行中，3已完成，4已取消，5已结束 |
| workOrderName | String  | 否   | 安检工单编号或者名称 模糊查询                         |
| sort          | int     | 否   | 工单时间排序(1:正序 2:倒序)                           |
| pageNum       | int     | 否   | 当前页数                                              |
| pageSize      | int     | 否   | 分页大小                                              |

● 请求实例

```jsonc
{
  "status": 1, // 工单状态
  "workOrderName": "啊啊", // 安检工单编号或者名称
  "sort": 1, // 排序
  "pageNum": 1, // 当前页数
  "pageSize": 10, // 分页大小
}
```

● 响应返回

```jsonc
{
  "code": 200, // 响应状态码
  "msg": "查询成功", // 响应消息
  "rows": [
    {
      "id": 1001, // 安检工单ID
      "workOrderNo": "AJGD20260702103001", // 安检工单号
      "workOrderName": "片区A居民安检工单", // 安检工单名称
      "templateId": 3, // 安检模板ID
      "templateName": "居民安检模板", // 安检模板名称
      "inspectionAreaId": 10, // 安检片区ID
      "inspectionAreaName": "片区A", // 安检片区名称
      "responsibleDeptId": 100, // 安检部门ID
      "responsibleDeptName": "安检一组", // 安检部门名称
      "inspectorId": 3001, // 安检员ID
      "inspectorName": "李四", // 安检员姓名
      "userCount": 120, // 工单安检用户总数
      "completedCount": 0, // 已完成用户数
      "failedCount": 0, // 失败用户数
      "canceledCount": 0, // 已取消用户数
      "status": 1, // 工单状态
      "assignStatus": 3, // 派单状态
      "assignTime": "2026-07-02 10:00:00", // 派单时间
      "planCompleteTime": "2026-07-02 12:00:00", // 计划完成时间
      "completeTime": "2026-07-02 14:00:00", // 实际完成时间
      "cancelTime": "2026-07-02 16:00:00" // 取消/结束时间
    }
  ],
  "total": 1 // 总记录数
```

## 2：查询工单下安检用户列表

● 接口描述

APP端查询某张工单下的安检用户。前端筛选条件中：全部不传 `status`，待安检传1，安检中传2，已完成传3，失败传4，已取消传5。

● 请求地址

GET `/inspection/app/workOrder/v0.2/{id}/users/list`

● 请求参数

| 字段名   | 类型    | 必填 | 说明                                           |
| -------- | ------- | ---- | ---------------------------------------------- |
| id       | Long    | 是   | 安检工单ID，路径参数                           |
| keyword  | String  | 否   | 搜索关键词，支持户号、户名、手机号、地址、表号 |
| sort     | int     | 否   | 时间排序(1:正序 2:倒序)                        |
| status   | Integer | 否   | 字典项：order_user_status                      |
| pageNum  | int     | 否   | 当前页数                                       |
| pageSize | int     | 否   | 分页大小                                       |

● 请求实例

```jsonc
{
  "status": 1, // 明细状态
  "keyword": "张三", // 户名
  "pageNum": 1, // 当前页数
  "pageSize": 10, // 分页大小
}
```

● 响应返回

```jsonc
{
  "code": 200, // 响应状态码
  "msg": "查询成功", // 响应消息
  "rows": [
    {
      "id": 5001, // 工单用户明细ID
      "workOrderId": 1001, // 安检工单ID
      "planId": 1, // 安检计划ID
      "gasUserId": 2001, // 燃气用户ID
      "inspectionAreaId": 10, // 安检片区ID快照
      "inspectionAreaName": "片区A", // 安检片区名称快照
      "communityId": 101, // 小区ID快照
      "communityName": "阳光小区", // 小区名称快照
      "householdNo": "HZ001", // 户号快照
      "householdName": "张三", // 户名快照
      "userType": "1", // 用户类型快照
      "userAddress": "阳光小区1幢101", // 用户地址快照
      "mobilePhone": "13500000000", // 手机号码快照
      "meterNo": "B001", // 表号快照
      "meterStatus": "1", // 表状态快照
      "gasUsageType": "1", // 用气类型快照
      "appointmentTime": null, // 预约安检时间
      "inspectionStartTime": null, // 开始安检时间
      "inspectionFinishTime": null, // 安检完成时间
      "unableReason": null, // 无法安检原因
      "inspectionResult": null, // 安检结果
      "inspectionRecordId": null, // 安检记录ID
      "finishTime": null, // 用户安检完成时间
      "status": 1, // 明细状态
      "remark": "", // 备注
    },
  ],
  "total": 1, // 总记录数
}
```

## 3：查询APP端单户安检详情

● 接口描述

安检员点击某个用户后查询详情。返回工单信息、工单用户快照、本次工单绑定的安检模板完整树、该用户历史安检记录。

● 请求地址

GET `/inspection/app/workOrder/v0.2/users/{workOrderUserId}/detail`

● 请求参数

| 字段名          | 类型 | 必填 | 说明                     |
| --------------- | ---- | ---- | ------------------------ |
| workOrderUserId | Long | 是   | 工单用户明细ID，路径参数 |

● 请求实例

```jsonc
{
  "workOrderUserId": 5001, // 工单用户明细ID
}
```

● 响应返回

```jsonc
{
  "code": 200, // 响应状态码
  "msg": "操作成功", // 响应消息
  "data": {
    "workOrder": {
      // 工单信息
      "id": 1001, // 安检工单ID
      "workOrderNo": "AJGD20260702103001", // 安检工单号
      "workOrderName": "片区A居民安检工单", // 安检工单名称
      "status": "1", // 工单状态 字典项：work_order_status
    },
    "workOrderUser": {
      // 工单用户明细
      "id": 5001, // 工单用户明细ID
      "gasUserId": 2001, // 燃气用户ID
      "householdNo": "HZ001", // 户号
      "householdName": "张三", // 户名
      "userAddress": "阳光小区1幢101", // 用户地址
      "mobilePhone": "13500000000", // 手机号码
      "meterNo": "B001", // 表号
      "status": "1", // 用户状态 字典项：order_user_status
    },
    "template": {
      // 安检模板完整树
      "id": 3, // 模板ID
      "templateName": "居民安检模板", // 安检模板名称
      "templateType": "1", // 模板类型
      "templateVersion": "V1.0", // 模板版本
      "groupList": [
        // 一级分组列表
        {
          "id": 31, // 分组ID
          "groupName": "燃气表检查", // 分组名称
          "itemList": [
            // 二级安检项列表
            {
              "id": 301, // 安检项ID
              "itemName": "表读数", // 安检项名称
              "itemDesc": "请填写当前表读数", // 安检项描述
              "checkStandard": "填写当前表读数", // 检查标准
              "inputType": "4", // 录入类型 字典项：input_type
              "photoRule": "3", // 拍照规则 字典项：photo_rule
              "maxPhotoCount": 1, // 最大拍照数量
              "detectLabels": ["1", "2"], // 识别标签 字典项：detect_label
              "enabled": 1, // 是否启用 0否，1是
              "subItemList": [
                {
                  "id": "2071850846356570113",
                  "subItemName": "正常",// 三级隐患项名称
                  "subItemType": "1",// 三级隐患项类型 字典项：sub_item_type
                  "dangerType": null,// 隐患类型 字典维护：danger_type
                  "dangerLevelName": null,// 隐患等级 字典维护：danger_level
                  "enabled": 1,// 是否启用 0否，1是
                },
                {
                  "id": "2071850846339792898",
                  "subItemName": "表面严重腐蚀",// 三级隐患项名称
                  "subItemType": "2",// 三级隐患项类型 字典项：sub_item_type
                  "dangerType": "gas_leak",// 隐患类型 字典维护：danger_type
                  "dangerLevelName": "1",// 隐患等级 字典维护：danger_level
                  "enabled": 1,// 是否启用 0否，1是
                },
              ], // 三级隐患项列表
            },
          ],
        },
      ],
    },
    "historyList": [
      // 历史安检记录
      {
        "id": 7999, // 安检记录ID
        "recordNo": "AJJL20250101101001", // 安检记录编号
        "inspectionFinishTime": "2025-01-01 10:10:00", // 安检完成时间
        "inspectionResult": 1, // 安检结果
        "dangerCount": 0, // 隐患数量
      },
    ],
  },
}
```

## 4：APP设置单户预约时间

● 接口描述

安检员在待安检用户列表中给某户设置预约时间。该操作只更新预约时间，不改变安检结果。

● 请求地址

POST `/inspection/app/workOrder/v0.2/users/{workOrderUserId}/appointment`

● 请求参数

| 字段名          | 类型 | 必填 | 说明                     |
| --------------- | ---- | ---- | ------------------------ |
| workOrderUserId | Long | 是   | 工单用户明细ID，路径参数 |
| appointmentTime | Date | 是   | 预约安检时间             |

● 请求实例

```jsonc
{
  "workOrderUserId": 5001, // 工单用户明细ID
  "appointmentTime": "2026-07-02 15:00:00", // 预约安检时间
}
```

● 响应返回

```jsonc
{
  "code": 200, // 响应状态码
  "msg": "操作成功", // 响应消息
}
```

## 5：APP AI识别

● 接口描述

APP端拍照后调用该接口进行AI识别。当前接口提供后端入口和AI日志落库能力，第三方模型接入后由服务层替换识别逻辑。识别结果可回填到模板检查项，安检员可继续修改。

● 请求地址

POST `/inspection/app/workOrder/v0.2/ai/recognize`

● 请求参数

| 字段名          | 类型   | 必填 | 说明           |
| --------------- | ------ | ---- | -------------- |
| workOrderUserId | Long   | 是   | 工单用户明细ID |
| itemId          | Long   | 是   | 模板检查项ID   |
| photoUrl        | String | 是   | 图片地址       |

● 请求实例

```jsonc
{
  "workOrderUserId": 5001, // 工单用户明细ID
  "itemId": 301, // 模板检查项ID
  "photoUrl": "/inspection/upload/2026/07/02/meter.jpg", // 图片地址
}
```

● 响应返回

```jsonc
{
  "code": 200, // 响应状态码
  "msg": "操作成功", // 响应消息
  "data": {
    "id": 4001, // AI识别日志ID
    "workOrderId": 1001, // 安检工单ID
    "workOrderUserId": 5001, // 工单用户明细ID
    "gasUserId": 2001, // 燃气用户ID
    "photoUrl": "/inspection/upload/2026/07/02/meter.jpg", // 识别图片地址
    "requestJson": "{}", // AI请求报文
    "responseJson": "{}", // AI响应报文
    "aiResult": "123.45", // AI识别结果
    "aiSuggestion": "建议回填表读数", // AI建议
    "confidence": 0.92, // 置信度
    "status": 1, // 识别状态
    "errorMessage": null, // 失败原因
    "analysisTime": "2026-07-02 10:30:00", // 识别时间
    "remark": "", // 备注
  },
}
```

## 6：APP正式提交安检结果

● 接口描述

APP端完整提交单户安检结果。该接口会保存安检记录主表、检查项结果、图片、隐患、AI日志，并回写工单用户状态和工单统计。

● 请求地址

POST `/inspection/app/workOrder/v0.2/submit`

● 请求参数

| 字段名                          | 类型       | 必填 | 说明                                                       |
| ------------------------------- | ---------- | ---- | ---------------------------------------------------------- |
| workOrderUserId                 | Long       | 是   | 工单用户明细ID                                             |
| inspectionMode                  | Integer    | 是   | 安检方式：1 AI安检，2人工安检，3无法安检                   |
| inspectionResult                | Integer    | 是   | 安检结果：1合格，2不合格，3无法安检                        |
| unableReason                    | Integer    | 否   | 无法安检原因：1到访不遇，2拒绝安检                         |
| signatureUrl                    | String     | 否   | 用户签名图片地址                                           |
| remark                          | String     | 否   | 备注                                                       |
| itemList                        | Array      | 否   | 检查项结果列表，无法安检时可为空                           |
| unablePhotoList                 | Array      | 否   | 无法安检证明图片列表                                       |
| itemList\[\].itemId             | Long       | 是   | 模板检查项ID                                               |
| itemList\[\].checkResult        | Integer    | 否   | 检查结果：1合格，2异常；文本/数字录入项可为空              |
| itemList\[\].resultValue        | String     | 否   | 填写值/选择值，例如表读数                                  |
| itemList\[\].aiSuggestion       | String     | 否   | AI建议                                                     |
| itemList\[\].photoList          | Array      | 否   | 检查项图片列表                                             |
| itemList\[\].dangerList         | Array      | 否   | 检查项隐患列表                                             |
| itemList\[\].aiLogList          | Array      | 否   | AI识别日志列表                                             |
| photoList\[\].photoUrl          | String     | 是   | 图片地址                                                   |
| photoList\[\].photoName         | String     | 否   | 图片名称                                                   |
| photoList\[\].photoType         | Integer    | 否   | 图片类型：1检查项图片，2隐患图片，3无法安检图片，4签名图片 |
| photoList\[\].uploadSource      | Integer    | 否   | 上传来源：1人工上传，2AI拍照                               |
| photoList\[\].sortNo            | Integer    | 否   | 排序号                                                     |
| dangerList\[\].templateDangerId | Long       | 否   | 模板隐患项ID                                               |
| dangerList\[\].dangerType       | Integer    | 否   | 隐患类型                                                   |
| dangerList\[\].dangerName       | String     | 是   | 隐患名称                                                   |
| dangerList\[\].dangerLevel      | Integer    | 否   | 隐患等级：1一级，2二级，3三级                              |
| dangerList\[\].dangerDesc       | String     | 否   | 隐患描述                                                   |
| dangerList\[\].rectifyDays      | Integer    | 否   | 整改时限，单位天                                           |
| aiLogList\[\].photoUrl          | String     | 否   | 识别图片地址                                               |
| aiLogList\[\].requestJson       | String     | 否   | AI请求报文                                                 |
| aiLogList\[\].responseJson      | String     | 否   | AI响应报文                                                 |
| aiLogList\[\].aiResult          | String     | 否   | AI识别结果                                                 |
| aiLogList\[\].aiSuggestion      | String     | 否   | AI建议                                                     |
| aiLogList\[\].confidence        | BigDecimal | 否   | 置信度                                                     |
| aiLogList\[\].status            | Integer    | 否   | 识别状态：1成功，2失败                                     |
| aiLogList\[\].errorMessage      | String     | 否   | 失败原因                                                   |

● 请求实例：AI安检/人工安检

```jsonc
{
  "workOrderUserId": 5001, // 工单用户明细ID
  "inspectionMode": 1, // 安检方式
  "inspectionResult": 2, // 安检结果
  "signatureUrl": "/inspection/upload/2026/07/02/sign.png", // 用户签名图片地址
  "itemList": [ // 检查项结果列表
    {
      "itemId": 301, // 模板检查项ID
      "checkResult": null, // 检查结果
      "resultValue": "123.45", // 填写值/选择值
      "aiSuggestion": "AI识别表读数为123.45", // A
      I建议
      "photoList": [ // 检查项图片列表
        {
          "photoUrl": "/inspection/upload/2026/07/02/meter.jpg", // 图片地址
          "photoName": "meter.jpg", // 图片名称
          "photoType": 1, // 图片类型
          "uploadSource": 2, // 上传来源
          "sortNo": 1 // 排序号
        }
      ],
      "dangerList": [] // 检查项隐患列表
    },
    {
      "itemId": 302, // 模板检查项ID
      "checkResult": 2, // 检查结果
      "resultValue": "软管老化", // 填写值/选择值
      "photoList": [ // 检查项图片列表
        {
          "photoUrl": "/inspection/upload/2026/07/02/danger.jpg", // 图片地址
          "photoName": "danger.jpg", // 图片名称
          "photoType": 2, // 图片类型
          "uploadSource": 1, // 上传来源
          "sortNo": 1 // 排序号
        }
      ],
      "dangerList": [ // 检查项隐患列表
        {
          "templateDangerId": 3001, // 模板隐患项ID
          "dangerType": 1, // 隐患类型
          "dangerName": "软管老化", // 隐患名称
          "dangerLevel": 2, // 隐患等级
          "dangerDesc": "软管存在老化裂纹", // 隐患描述
          "rectifyDays": 7, // 整改时限
          "photoList": [ // 隐患图片列表
            {
              "photoUrl": "/inspection/upload/2026/07/02/danger.jpg", // 图片地址
              "photoName": "danger.jpg", // 图片名称
              "photoType": 2, // 图片类型
              "uploadSource": 1 // 上传来源
            }
          ]
        }
      ]
    }
  ]
}

```

● 请求实例：无法安检

```jsonc
{
  "workOrderUserId": 5002, // 工单用户明细ID
  "inspectionMode": 3, // 安检方式
  "inspectionResult": 3, // 安检结果
  "unableReason": 1, // 无法安检原因
  "remark": "到访不遇，已拍照留证", // 备注
  "unablePhotoList": [
    // 无法安检证明图片列表
    {
      "photoUrl": "/inspection/upload/2026/07/02/unable.jpg", // 图片地址
      "photoName": "unable.jpg", // 图片名称
      "photoType": 3, // 图片类型
      "uploadSource": 1, // 上传来源
      "sortNo": 1, // 排序号
    },
  ],
}
```

● 响应返回

```jsonc
{
  "code": 200, // 响应状态码
  "msg": "操作成功", // 响应消息
  "data": {
    "id": 8001, // 安检记录ID
    "recordNo": "AJJL20260702113001", // 安检记录编号
    "workOrderId": 1001, // 安检工单ID
    "workOrderNo": "AJGD20260702103001", // 安检工单号
    "workOrderUserId": 5001, // 工单用户明细ID
    "gasUserId": 2001, // 燃气用户ID
    "householdName": "张三", // 户名
    "inspectionMode": 1, // 安检方式
    "inspectionResult": 2, // 安检结果
    "dangerCount": 1, // 隐患数量
    "signatureUrl": "/inspection/upload/2026/07/02/sign.png", // 用户签名图片地址
    "status": 2, // 记录状态
  },
}
```

## 7：首页统计

查询今日待安检用户数量，和今日安检过的高风险用户数量

今日待安检小区数量   今日需要安检的总用户数量

● 接口描述

   app首页统计 今日待检 高风险用户  今日 安检小区数 安检户数

● 请求地址

POST `/inspection/app/workOrder/v0.2/statistics`

● 请求类型

`multipart/form-data`

● 请求参数

| 字段名 | 类型 | 必填 | 说明   |
| ------ | ---- | ---- | ------ |
| userId | Long | 是   | 用户id |

● 请求实例

```jsonc
{
  "userId": 63236, // 用户id
}
```

● 响应返回

```jsonc
{
  "code": 200, // 响应状态码
  "msg": "操作成功", // 响应消息
  "data": {
      "todayPendingCount": 100,  今日待检查数量
      "highRiskUserCount":  2,     高风险用户数量
      "inspectionCommunityCount": 5,    今日安检小区数量
      "inspectionUserCount": 200      今日总安检户数
  }
}
```
