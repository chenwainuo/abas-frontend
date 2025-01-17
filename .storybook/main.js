const path = require('path');

module.exports = {
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/preset-create-react-app",
    {
      /**
       * Fix Storybook issue with PostCSS@8
       * @see https://github.com/storybookjs/storybook/issues/12668#issuecomment-773958085
       */
      name: '@storybook/addon-postcss',
      options: {
        postcssLoaderOptions: {
          implementation: require('postcss'),
        },
      },
    },
  ],
  "core": {
    "builder": "webpack5"
  },
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // "@/*": ["./src/*"],
      "@/stores": path.resolve(__dirname, "../src/stores"),
      "@/models": path.resolve(__dirname, "../src/models"),
      "@/utils": path.resolve(__dirname, "../src/utils"),
      "@/components": path.resolve(__dirname, "../src/components")
    },
    config.module.rules.push({
      test: /\,css&/,
      use: [
        {
          loader: 'postcss-loader',
          options: {
            ident: 'postcss',
            plugins: [
              require('tailwindcss'),
              require('autoprefixer')
            ]
          }
        }
      ],
      include: path.resolve(__dirname, '../'),
    })
    return config
  }
}


// "@storybjook/addon-interactions",
    // {name: '@storybook/addon-postcss',
    //   options: {
    //     postcssLoaderOptions: {
    //       implementation: require('postcss'),
    //     },
  //     },
  //   }
  // ],
  // "framework": "@storybook/react",
  // "core": {
  //   "builder": "webpack5"
  // },
  // "typescript": {
  //   check: true 
  // },
  // "webpackFinal": async (config, {configType}) =>{
  //   config.resolve.alias = {
  //     ...config.resolve.alias,
  //     // "@/*": ["./src/*"],
  //     "@/components": path.resolve(__dirname, "../src/components")
  //   }
  //   return config;