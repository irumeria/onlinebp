<template>
  <div id="app_train">
    <b-row style="width: 90%; margin: 0px auto">
      <b-col :md="12" :lg="6" :xl="6">
        <div class="box-card-s">
          <div>
            <b-jumbotron header="excel-BP online">
              <p>在线神经网络训练小工具</p>
            </b-jumbotron>
          </div>
          <b-form-file
            v-model="file"
            ref="file-input"
            class="mb-2"
          ></b-form-file>
          <div>只能上传xlsx文件</div>
          <br />
          <div
            style="
              display: flex;
              justify-content: space-around;
              align-items: center;
            "
          >
            <div>
              <b-button variant="primary" @click="startT">开始训练</b-button>
            </div>
            <div>
              <b-button v-b-toggle.sidebar-right variant="primary">
                关于它
              </b-button>
            </div>
          </div>
        </div>
        <div v-if="ifTraining">
          训练进度：
          <b-progress
            :value="process"
            variant="warning"
            striped
            :animated="true"
          ></b-progress>
        </div>
      </b-col>
      <b-col :md="12" :lg="6" :xl="6">
        <div class="box-card-s">
          <h2>参数调整</h2>
          <hr style="margin: 10px" />
          <div>
            <span style="float: left">预测列名(默认为第一列)</span>
          </div>
          <b-form-input
            v-model="column"
            placeholder="请输入内容"
          ></b-form-input>
          <br />
          <br />
          <!-- <div><span>训练周期数(默认30)</span></div> -->
          <label for="range-2"
            >训练周期数: <strong>{{ epho }}</strong></label
          >
          <b-form-input
            id="range-2"
            v-model="epho"
            type="range"
            min="10"
            max="500"
            step="1"
          ></b-form-input>
          <div style="display: flex; margin: 20px 0px">
            <div style="width: 50%">选择的优化器:</div>
            <b-form-select
              v-model="selected_opt"
              :options="opt_options"
              style="margin: 0px 5rem; float: right"
            ></b-form-select>
          </div>
          <!-- <div style="display: flex; margin: 20px 0px">
            <div style="width:50%">选择的损失函数:</div>
            <b-form-select
              v-model="selected_loss"
              :options="loss_options"
              style="margin: 0px 5rem; float: right"
            ></b-form-select>
          </div> -->
          <!-- <div style="display: flex; margin: 20px 0px">
            <div style="width: 50%">中间层大小:</div>
            <b-form-spinbutton
              id="sb-inline"
              v-model="value"
              inline
            ></b-form-spinbutton>
          </div> -->
        </div>
      </b-col>
    </b-row>

    <div
      id="canvas_tr"
      style="width: 70%; height: 40vh; margin: 40px auto"
    ></div>
    <div class="box-card1" v-if="ifTrain">
      <div style="width: 100%">
        <h2 style="float: left">进行预测</h2>
        <p>(导入第一行作为预设值)</p>
      </div>
      <div style="display: flex; flex-wrap: wrap">
        <div v-for="i in predata.data.length - 1" :key="i">
          <span>{{ predata.labels[i - 1] }}</span>
          <b-form-input v-model="predata.data[i - 1]"></b-form-input>
        </div>
      </div>
      <div style="width: 100%">
        <b-button style="float: left" variant="primary" @click="Predict"
          >预测</b-button
        >
      </div>
      <div style="width: 100%" v-if="ifPre">
        <h2>{{ predata.target_label }}预测值:{{ prediction }}</h2>
      </div>
    </div>

    <b-sidebar id="sidebar-right" width="20rem"  backdrop right shadow lazy >
      <div style="margin-top: 20%">
        <h3 style="margin: 5rem">使用说明</h3>
        <h6>这是一个基于tensorflow.js的在线excel->BP神经网络训练小玩具~</h6>
        <img
          style="
            margin: 20px;
            width: auto;
            height: auto;
            max-width: 100%;
            max-height: 100%;
          "
          src="../assets/form_required.png"
        />
        <h6>上传格式：一个excel表，它的其中一列为预测值，其他为训练值</h6>
        <br />
        <h6>默认网络结构：4层,32节点/层+一层dropout</h6>
        <h6>第一层softmax激活，后两层elu激活</h6>
        <br />
        <h6>默认折分方式：训练集/检验集=4:1</h6>
        <h6>默认损失函数：均方差损失</h6>
        <br />
        <h6>训练情况可以在<strong>开发者工具---控制台</strong>中查看</h6>
        <br />
        <!-- <h5>
          <a href="https://....xlsx">下载示例excel</a>
        </h5> -->
      </div>
    </b-sidebar>
  </div>
</template>

<script>
import * as echarts from "echarts";
import main from "../utils/main.js";
import xlsx from "xlsx";
export default {
  data() {
    return {
      file: undefined,
      epho: 30,
      column: undefined,
      predata: {
        target: undefined,
        target_label: undefined,
        labels: [],
        data: [],
      },
      ifTrain: false,
      model: undefined,
      max: [],
      min: [],
      prediction: undefined,
      ifPre: false,
      process: 0,
      ifTraining: false,
      opt_options: [
        { value: "adam", text: "adam" },
        { value: "sgd", text: "sgd" },
        { value: "rmsprop", text: "rmsprop" },
        { value: "adagrad", text: "adagrad" },
      ],
      selected_opt: "adam",
      loss_options: [
        { value: "meanSquaredError", text: "meanSquaredError" },
        { value: "sigmoidCrossEntropy", text: "sigmoidCrossEntropy" },
        { value: "softmaxCrossEntropy", text: "softmaxCrossEntropy" },
        { value: "cosineDistance", text: "cosineDistance" },
      ],
      selected_loss: "meanSquaredError",
    };
  },
  methods: {
    Toast(variant = null, toaster, title, content) {
      this.$bvToast.toast(content, {
        title: title,
        variant: variant,
        solid: true,
        toaster: toaster,
      });
    },
    reEach(message, process) {
      console.log(message, process);
      this.process = process;
    },
    isExcel(file) {
      return /\.(xlsx|xls|csv)$/.test(file.name);
    },
    Predict() {
      var _this = this;
      main
        .preModel(this.max, this.min, this.predata.data.slice(0))
        .then((prediction) => {
          _this.ifPre = true;
          console.log(prediction);
          _this.prediction = prediction;
        })
        .catch((error) => {
          console.log(error);
          _this.Toast("error", "b-toaster-top-center", "出错", "输入数据有误");
        });
    },
    async loadModel() {
      this.model = await main.loadModel();
    },
    startT() {
      var _this = this;
      var file = _this.file;

      if (file) {
        if (!_this.isExcel(file)) {
          _this.Toast(
            "error",
            "b-toaster-top-center",
            "错误",
            "只能使用excel进行训练~"
          );
          return;
        }
        try {
          var reader = new FileReader();
          // 读取上传的excel
          reader.readAsBinaryString(file);
          reader.onload = function (e) {
            var data = this.result;
            const workbook = xlsx.read(data, {
              type: "binary",
            });
            const wsname = workbook.SheetNames[0];
            const sheet = workbook.Sheets[wsname];
            const ws = xlsx.utils.sheet_to_json(sheet);
            let props = undefined;
            // 获取最大最小值 & 数据预处理
            if (typeof _this.column != "undefined") {
              if (main.ifCol(ws, _this.column)) {
                let transData = main.JSON2Matrix_transF(ws, _this.column);
                console.log(transData);
                _this.predata.labels = transData.cols.slice(1);
                // 将第一行保存为预设值
                // 将目标标签和目标值单独拿出来
                _this.predata.target_label = transData.cols[0];
                _this.predata.target = transData.data[0][0];
                _this.predata.data = transData.data[0].slice(1);
                // console.log(_this.predata.data.length);
                props = main.max_min(transData.data);
                _this.max = props.max;
                _this.min = props.min;
              } else {
                _this.Toast(
                  "error",
                  "b-toaster-top-center",
                  "出错",
                  "数据中没有此列"
                );
                return;
              }
            } else {
              let transData = main.JSON2Matrix(ws, _this.column);
              console.log(transData);
              _this.predata.labels = transData.cols.slice(1);
              _this.predata.target_label = transData.cols[0];
              _this.predata.target = transData.data[0][0];
              _this.predata.data = transData.data[0].slice(1);
              props = main.max_min(transData.data);
              _this.max = props.max;
              _this.min = props.min;
            }
            if (_this.epho > 1000 || _this.epho < 1) {
              _this.Toast(
                "error",
                "b-toaster-top-center",
                "出错",
                "训练周期取值出错"
              );
              return;
            }
            // 开始训练
            _this.ifTraining = true;
            main
              .fitModel(
                props.data,
                _this.epho,
                _this.reEach,
                _this.selected_opt
              )
              .then((history) => {
                // 拿到返回的数据
                _this.ifTraining = false;
                _this.process = 0;
                console.log(history);
                // 画图
                let xlable = new Array(history.history.loss.length);
                for (var i = 1; i <= xlable.length; i++) {
                  xlable[i - 1] = i;
                }
                let option = {
                  title: {
                    text: "训练情况",
                  },
                  tooltip: {
                    trigger: "axis",
                  },
                  legend: {
                    data: ["训练损失", "验证损失"],
                  },
                  grid: {
                    left: "3%",
                    right: "4%",
                    bottom: "3%",
                    containLabel: true,
                  },
                  toolbox: {
                    feature: {
                      saveAsImage: {},
                    },
                  },
                  xAxis: {
                    name: "周期",
                    type: "category",
                    boundaryGap: false,
                    data: xlable,
                  },
                  yAxis: {
                    name: "平方根损失",
                    type: "value",
                  },
                  series: [
                    {
                      name: "训练损失",
                      type: "line",
                      stack: "总量",
                      data: history.history.loss,
                    },
                    {
                      name: "验证损失",
                      type: "line",
                      stack: "总量",
                      data: history.history.val_loss,
                    },
                  ],
                };
                var myChart = echarts.init(
                  document.getElementById("canvas_tr")
                );
                myChart.setOption(option);
                _this.ifTrain = true;
              })
              .catch((e) => {
                console.log(e);
                _this.Toast(
                  "error",
                  "b-toaster-top-center",
                  "出错",
                  "excel数据出错~"
                );
              });
          };
        } catch (error) {
          console.log(error);
          _this.Toast(
            "error",
            "b-toaster-top-center",
            "出错",
            "excel数据出错~"
          );
        }

        // 从本地存储中加载模型,存放于变量model中
        try {
          _this.loadModel();
        } catch (error) {
          console.log(error);
          _this.Toast(
            "error",
            "b-toaster-top-center",
            "出错",
            "浏览器版本过低惹~"
          );
        }
      } else {
        _this.Toast(
          "error",
          "b-toaster-top-center",
          "出错",
          "还没有上传文件哦~"
        );
      }
    },

  },
  mounted() {
    this.$emit("Change", "5");
  },
};
</script>

<style>
#app_train {
  margin: 0px;
  padding: 0px;
  /* height: 80%; */
  min-height: 90vh;
}

.box-card-s {
  margin: 30px auto;
  /* margin-top: 30px; */
  padding: 20px;
  min-height: 15rem;
  max-width: 40rem;
  background: rgba(255, 255, 255, 0.75);
  /* width: 90%; */
  box-sizing: border-box;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  color: darkslategrey;
  font-size: 1.2rem;
}
.box-card1 {
  margin: 30px 20%;
  padding: 20px;
  min-height: 20rem;
  background: rgba(255, 255, 255, 0.9);
  box-sizing: border-box;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  color: darkslategrey;
  font-size: 1.2rem;
  display: flex;
  flex-wrap: wrap;
}
.box-card1 div {
  margin: 10px;
}
#app_train {
  background: rgba(231, 238, 246, 0.15);
  box-sizing: border-box;
  padding: 20px;
  min-height: 100vh;
}
#backimg img{
  margin: 0px;
  padding: 0px;
  max-width: 90%;
  max-height: 60%;
  background-size: cover;
}
#backimg{
  position: absolute;
  top:2rem;
  left:2rem;
  display: flex;
}
/* #backimg :hover {
  color: blueviolet;
} */
</style>