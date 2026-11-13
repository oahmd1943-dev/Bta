/**
 * إعداد Capacitor لبناء تطبيق أندرويد من نسخة الويب.
 * راجع README.md (قسم التغليف كتطبيق أندرويد) لخطوات البناء والصلاحيات.
 */
const config = {
  appId: "com.yam.batta",
  appName: "بَطّة",
  webDir: "dist",
  android: {
    allowMixedContent: false,
    backgroundColor: "#081830",
  },
  plugins: {
    Camera: {
      // الصور تُصغَّر داخل التطبيق قبل حفظها محلياً
      presentationStyle: "popover",
    },
  },
};

export default config;
