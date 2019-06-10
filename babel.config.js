module.exports = function (api) {
  api.cache(true);

  return {
    "plugins": [
      "@babel/plugin-transform-runtime"
    ],
    "presets": [
      [
        "@babel/preset-env",
        {
          modules: process.env.ESM ? false : "cjs",
          loose: true
        }
      ]
    ]
  };

}
