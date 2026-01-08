declare module "remark-emoticons" {
	import { Plugin } from "unified";
	const remarkEmoticons: Plugin<[Options?]>;
	interface Options {
		emoticons?: Record<string, string>; // e.g., { ':)': '/path/to/emoji.png' }
		classes?: string; // CSS class for output
	}
	export default remarkEmoticons;
}
