'use strict'
// import defaultSettings from './src/config'
const path = require('path')
const defaultSettings = require('./src/config')
const TerserPlugin = require('terser-webpack-plugin')
const CompressionWebpackPlugin = require('compression-webpack-plugin')

const productionGzipExtensions = ['js', 'css']
const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'
function resolve (dir) {
  return path.join(__dirname, dir)
}
const name = defaultSettings.title || 'vue Admin Template' // page title
// If your port is set to 80,
// use administrator privileges to execute the command line.
// For example, Mac: sudo npm run
const port = process.env.port || 9528 // dev port

// All configuration item explanations can be find in https://cli.vuejs.org/config/
module.exports = {
  /**
   * You will need to set publicPath if you plan to deploy your site under a sub path,
   * for example GitHub Pages. If you plan to deploy your site to https://foo.github.io/bar/,
   * then publicPath should be set to "/bar/".
   * In most cases please use '/' !!!
   * Detail: https://cli.vuejs.org/config/#publicpath
   */
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'static',
  indexPath: 'index.html',
  lintOnSave: isDevelopment,
  productionSourceMap: false,
  devServer: {
    port: port,
    open: true,
    overlay: {
      warnings: false,
      errors: true
    },
    proxy: {
      // change xxx-api/login => mock/login
      // detail: https://cli.vuejs.org/config/#devserver-proxy
      [process.env.VUE_APP_BASE_API]: {
        target: `http://127.0.0.1:${port}/mock`,
        pathRewrite: {
          ['^' + process.env.VUE_APP_BASE_API]: ''
        },
        changeOrigin: true // set the option changeOrigin to true for name-based virtual hosted sit
      }
    },
    after: require('./mock/mock-server.js')
  },
  // configureWebpack: {
  //   // provide the app's title in webpack's name field, so that
  //   // it can be accessed in index.html to inject the correct title.
  //   name: name,
  //   resolve: {
  //     alias: {
  //       '@': resolve('src')
  //     },
  //     styles: path.resolve(__dirname, './src/styles')
  //   }
  // },
  configureWebpack (config) {
    config.performance = {
      hints: false
      //   hints: process.env.NODE_ENV === 'production' && !process.env.VUE_APP_TEST && 'warning'
    } // 打开/关闭提示。此外，当找到提示时，告诉 webpack 抛出一个错误或警告。此属性默认设置为 "warning" https://cloud.tencent.com/developer/section/1477466

    if (!isDevelopment) {
      config.externals = {
        vue: 'Vue',
        'vue-router': 'VueRouter'
        //   vuex: 'Vuex',
        //   axios: 'axios',
        //   AMap: 'AMap'
        // 'element-ui': 'ELEMENT',
      }
      config.plugins.push(
        new CompressionWebpackPlugin({
          algorithm: 'gzip',
          test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
          threshold: 10240,
          minRatio: 0.8
        })
      )
      config.optimization = {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            // Use multi-process parallel running to improve the build speed. Default number of concurrent runs: os.cpus().length - 1
            // Parallelization can speedup your build significantly and is therefore highly recommended.
            // parallel可以显着加快构建速度，因此官方文档强烈建议使用
            parallel: true,
            terserOptions: {
              ecma: 6,
              warnings: false,
              compress: {
                drop_debugger: true,
                drop_console: isProduction
              }
            }
          })
        ]
      }
    }
  },
  chainWebpack (config) {
    config.name = name
    config.resolve.alias.set('@', resolve('src'))
    config.resolve.alias.set('styles', path.resolve(__dirname, './src/styles'))
    config.plugins.delete('preload') // TODO: need test
    config.plugins.delete('prefetch') // TODO: need test

    // set svg-sprite-loader
    config.module
      .rule('svg')
      .exclude.add(resolve('src/icons'))
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()

    // set preserveWhitespace
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        options.compilerOptions.preserveWhitespace = true
        return options
      })
      .end()

    config
      // https://webpack.js.org/configuration/devtool/#development
      .when(process.env.NODE_ENV === 'development', config =>
        config.devtool('cheap-source-map')
      )

    config.when(!isDevelopment, config => {
      config
        .plugin('ScriptExtHtmlWebpackPlugin')
        .after('html')
        .use('script-ext-html-webpack-plugin', [
          {
            // `runtime` must same as runtimeChunk name. default is `runtime`
            inline: /runtime\..*\.js$/
          }
        ])
        .end()
      config.optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          libs: {
            name: 'chunk-libs',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial' // only package third parties that are initially dependent
          },
          elementUI: {
            name: 'chunk-elementUI', // split elementUI into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
          },
          commons: {
            name: 'chunk-commons',
            test: resolve('src/components'), // can customize your rules
            minChunks: 3, //  minimum common number
            priority: 5,
            reuseExistingChunk: true
          }
        }
      })
      config.optimization.runtimeChunk('single')
    })
  },
  css: {
    extract: false, // 是否使用css分离插件 ExtractTextPlugin
    sourceMap: false, // 开启 CSS source maps?
    // css预设器配置项 详见https://cli.vuejs.org/zh/config/#css-loaderoptions
    requireModuleExtension: false // 启用 CSS modules for all css / pre-processor files.
  }
}
