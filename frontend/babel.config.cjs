// Solo lo usa Jest (babel-jest). Vite compila con esbuild y no lee este archivo.
module.exports = {
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
    ],
};
