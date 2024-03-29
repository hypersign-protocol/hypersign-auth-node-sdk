const path = require('path')
const R = require('ramda')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

function configure(filename, opts = {}) {
    return (env, argv) => R.mergeDeepRight({
        entry: './src/index.js',
        mode: 'development', // automatically overriden by production flag
        devtool: argv.mode === 'production' ? 'source-map' : 'eval-source-map',
        node: {
            fs: 'empty',
            __dirname: false
        },
        module: {
            rules: [{
                    test: /\.js$/,
                    include: path.resolve(__dirname, 'es'),
                    loader: 'babel-loader'
                },
                {
                    test: /\.js$/,
                    include: path.resolve(__dirname, 'node_modules/rlp'),
                    loader: 'babel-loader',
                    options: { presets: ['@babel/preset-env'] }
                }
            ]
        },
        plugins: argv.report ? [
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                reportFilename: filename + '.html',
                openAnalyzer: false
            })
        ] : [],
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename,
            library: 'Ae',
            libraryTarget: 'umd'
        },
        externals: Object
            .keys(require('./package').dependencies)
            .reduce((p, dependency) => ({
                ...p,
                [dependency]: {
                    commonjs: dependency,
                    commonjs2: dependency
                }
            }), {})
    }, opts)
}

module.exports = [
    configure('hypersign-auth-node-sdk.js', { target: 'node' }),
]