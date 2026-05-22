<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { guardCurrentPage } from '@/utils/permission'

onLaunch(() => {
  guardCurrentPage()
})

onShow(() => {
  guardCurrentPage()
})
</script>

<style lang="scss">
@import '@/styles/common.scss';
</style>
