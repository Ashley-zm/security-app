<script setup lang="ts">
import { onLaunch, onShow } from "@dcloudio/uni-app";
import { guardCurrentPage } from "@/utils/permission";

function lockPortraitOrientation() {
  // #ifdef APP-PLUS
  plus.screen.lockOrientation("portrait-primary");
  // #endif
}

onLaunch(() => {
  lockPortraitOrientation();
  guardCurrentPage();
});

onShow(() => {
  guardCurrentPage();
  lockPortraitOrientation();
});
</script>

<style lang="scss">
@import "@/styles/common.scss";
</style>
