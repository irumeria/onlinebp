import * as tf from '@tensorflow/tfjs';

async function Predict(array,max,min) {
    console.log("====loading model====");
    const model = await tf.loadLayersModel('localstorage://my-model');
    console.log(tf.stack([array]))
    let prediction = model.predict(tf.stack([array])).arraySync();
    prediction = prediction*(max-min)+min;
    console.log("prediction=" + prediction);
    return((Math.round(prediction * 100) / 100).toString());
}

async function Train(train_data, train_target, model, epochs,reEach) {
    let present = 0;
    let history = await model.fit(train_data, train_target, {
        validationSplit: 0.8,
        epochs: epochs,
        callbacks: {
            onEpochEnd(epoch, logs) {
                // console.log(logs);
                present++;
                reEach(logs,present*100.0/epochs);
            }
        }
    });
    await model.save('downloads://my-model');
    await model.save('localstorage://my-model');
    console.log(history.history.loss);
    return history;
}

export default {
    async loadModel() {
        const model = await tf.loadLayersModel("localstorage://my-model");
        return model;
    },

    preModel(max, min, array) {
        for (var i = 0; i < array.length; i++) {
            array[i] = (array[i] - min[i+1]) / (max[i+1] - min[i+1]);
        }
        console.log(array)
        return Predict(array,max[0],min[0]);
    },
    // 标准归一化
    max_min(matrix) {
        let ret = {
            max: [],
            min: [],
            data: []
        };
        let data = [];
        for (let i = 0; i < matrix.length; i++) {
            data[i] = new Array();
        }
        ret.data = data;

        let new_matrix = [];
        for (let i = 0; i < matrix[0].length; i++) {
            new_matrix[i] = new Array();
        }

        for (let j = 0; j < matrix[0].length; j++) {
            for (let i = 0; i < matrix.length; i++) {
                new_matrix[j][i] = matrix[i][j];
            }
        }

        // console.log(new_matrix);
        for (let i = 0; i < new_matrix.length; i++) {
            ret.max[i] = Math.max(...new_matrix[i]);
            ret.min[i] = Math.min(...new_matrix[i]);
        }

        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[0].length; j++) {
                let item = matrix[i][j];
                item = (item - ret.min[j]) / (ret.max[j] - ret.min[j]);
                ret.data[i][j] = item;
            }
        }
        return ret;
    },
    getJsonLength(jsonData) {
        var jsonLength = 0;
        for (var item in jsonData) {
            jsonLength++;
        }
        return jsonLength;
    },

    //判断某键是否在有序JSON数组的键内
    ifCol(org, primeKey) {
        let ret = false;
        for (var key in org[0]) {
            if (key == primeKey) {
                ret = true;
            }
        }
        return ret;
    },
    //[{},{},...]有序JSON转数组,且删除原第一列"__EMPTY"
    // 并且指定一个主键，把它移到第一列，并返回一个JSON对象{cols:重组后的键名数组,data:重组后的得到的矩阵}
    JSON2Matrix_transF(org, primeKey) {
        let ret = {
            cols: [],
            data: this.createMatrix(org.length)
        }
        console.log(org)
        ret.cols[0] = primeKey;
        for (var i = 0; i < org.length; i++) {
            var j = 1;
            for (var key in org[i]) {
                if(key == "__EMPTY"){
                    continue;
                }
                if (key == primeKey) {
                    ret.data[i][0] = org[i][key];
                } else {
                    if (i == 0) {
                        ret.cols[j] = key;
                    }
                    ret.data[i][j] = org[i][key];
                    j++;
                }

            }
        }
        return ret;
    },

    //[{},{},...]有序JSON转数组,且删除第一列"__EMPTY"
    //并返回一个JSON对象{cols:键名的数组,data:得到的矩阵}
    JSON2Matrix(org) {
        let ret = {
            cols: [],
            data: this.createMatrix(org.length)
        }

        // console.log(org)
        // ret.cols[0] = org[0][0];
        for (var i = 0; i < org.length; i++) {
            var j = 0;    
            for (var key in org[i]) {
                if(key == "__EMPTY"){
                    continue;
                }
                if (i == 0) {     
                    ret.cols[j] = key;   
                }
                ret.data[i][j] = org[i][key];
                j++;
            }
        }
        return ret;
    },

    // 生成一个有a行的矩阵
    createMatrix(a) {
        let ret = [];
        if (a > 0) {
            for (let i = 0; i < a; i++) {
                ret[i] = new Array();
            }
        }

        return ret;
    },
    // 训练模型
    fitModel(data, epochs,reRach,optimizer) {
        // 创建模型
        const model = tf.sequential();
        model.add(tf.layers.dense({
            units: 32,
            inputShape: [data[0].length - 1],
            activation: "softmax"
        }));
        model.add(tf.layers.dense({
            units: 32,
            activation: "elu",
        }));
        model.add(tf.layers.dropout({
            rate: 0.5
        }));
        model.add(tf.layers.dense({
            units: 1,
            activation: "elu",
        }));
        let ratio = 0.95; //默认5:1分割为训练集和验证集,后面fit的split实现了，于是这里就乱写了。。
        let tl = Math.ceil(data.length * ratio);
        const ti_max = 1; // 默认将第一列作为预测值
        let train_target = this.createMatrix(ti_max);
        let validation_target = this.createMatrix(ti_max);
        let train_data = this.createMatrix(tl);
        let validation_data = this.createMatrix(data.length - tl);
        let ti = ti_max;
        if (ti_max == 1) {
            for (var i = 0; i < data.length; i++) {
                ti = ti_max;
                for (var j = 0; j < data[i].length; j++) {
                    if (i < tl) {
                        if (ti > 0) {
                            train_target[i] = data[i][j];
                            ti--;
                        } else {
                            train_data[i][j - ti_max] = data[i][j];
                        }
                    } else {
                        if (ti > 0) {
                            validation_target[i] = data[i][j];
                            ti--;
                        } else {
                            validation_data[i - tl][j - ti_max] = data[i][j];
                        }
                    }
                }
            }
        } else {
            // TODO
        }
        // Prepare the model for training: Specify the loss and the optimizer.
        model.compile({
            loss: "meanSquaredError",
            optimizer: optimizer
        });

        // tensor化
        train_target = tf.tensor2d(train_target, [train_target.length, ti_max]);
        train_data = tf.tensor2d(train_data, [train_data.length, train_data[0].length]);

        let history = Train(train_data, train_target, model, epochs,reRach);

        return history;
    }
}