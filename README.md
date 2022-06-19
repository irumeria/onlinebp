# OnlineBP

### 基于 tensorflow.js 与 vue 开发的Excel数据神经网络训练平台


## 使用

+ 依赖安装
```bash
yarn 
```

+ 调试开发
```bash
yarn serve 
```
or (for @vue-cli)
```bash
vue ui 
```

+ 编译静态页面
```bash
yarn build
```

## 效果预览

+ 测试基于某炼铜电弧炉的部分生产数据进行（源数据已经经过批量修改）

+ 训练中：通过excel的其他列预测其中某一列的数据
<img src="./demos/training.png" />

+ 训练结果（网络下载+效果预览）
<img src="./demos/result.png" />