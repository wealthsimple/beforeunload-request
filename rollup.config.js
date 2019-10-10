import pkg from './package.json';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';
import license from 'rollup-plugin-license';

export default [
	{
		input: 'src/index.js',
		output: { file: pkg.module, format: 'es' },
		plugins: [
			resolve(),
			license({
				banner: {
					content: {
						file: './LICENSE'
					}
				}
			})
		]
	},
	{
		input: 'src/index.js',
		output: {
			name: 'beforeunloadRequest',
			file: pkg.browser,
			format: 'umd',
			sourcemap: true
		},
		plugins: [
			resolve(),
			babel({ exclude: 'node_modules/**' }),
			uglify(),
			license({
				banner: {
					content: {

						file: './LICENSE'
					}
				}
			})
		]
	}
];
