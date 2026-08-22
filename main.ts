import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { setupPermission } from "@/utils/permission";

import UniCard from "@/uni_modules/uni-card/components/uni-card/uni-card.vue";
import UniDatetimePicker from "@/uni_modules/uni-datetime-picker/components/uni-datetime-picker/uni-datetime-picker.vue";
import UniIcons from "@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue";
import UniLoadMore from "@/uni_modules/uni-load-more/components/uni-load-more/uni-load-more.vue";
import UniPopup from "@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue";
import UniPopupDialog from "@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue";
import UniPopupMessage from "@/uni_modules/uni-popup/components/uni-popup-message/uni-popup-message.vue";
import UniPopupShare from "@/uni_modules/uni-popup/components/uni-popup-share/uni-popup-share.vue";
import UniSection from "@/uni_modules/uni-section/components/uni-section/uni-section.vue";
import UniSwipeAction from "@/uni_modules/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue";
import UniSwipeActionItem from "@/uni_modules/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue";
import UniTransition from "@/uni_modules/uni-transition/components/uni-transition/uni-transition.vue";

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();

  app.use(pinia);

  app.component("uni-card", UniCard);
  app.component("uni-datetime-picker", UniDatetimePicker);
  app.component("uni-icons", UniIcons);
  app.component("uni-load-more", UniLoadMore);
  app.component("uni-popup", UniPopup);
  app.component("uni-popup-dialog", UniPopupDialog);
  app.component("uni-popup-message", UniPopupMessage);
  app.component("uni-popup-share", UniPopupShare);
  app.component("uni-section", UniSection);
  app.component("uni-swipe-action", UniSwipeAction);
  app.component("uni-swipe-action-item", UniSwipeActionItem);
  app.component("uni-transition", UniTransition);

  setupPermission();

  return {
    app,
    Pinia: pinia,
  };
}
