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
          modules: process.env.CJS ? "cjs" : false,
          loose: true
        }
      ]
    ]
  };

}
