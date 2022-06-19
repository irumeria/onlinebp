<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  mounted() {
    this.changeMusic();
    let w = window.innerWidth;
    if (w <= 720) {
      var bodyEle = document.body;
      bodyEle.style.background = "	#D8BFD8";
    }
  },
};
</script>
<style>
html body #app {
  margin: 0px;
  padding: 0px;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
body {
  background-image: url("./assets/ai.jpg");
  /* background: #e6e6fa; */
  width: 100%;
  height: 100%;
  position: absolute;
  background-repeat: no-repeat;
  background-size: cover;
  background-attachment: fixed;
}

</style>
