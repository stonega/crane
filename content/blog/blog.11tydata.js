export default {
	tags: [
		"posts"
	],
	"layout": "layouts/post.njk",
	lang: "zh-CN",
	isTranslation: false,
	eleventyComputed: {
		translationKey: (data) => data.page.filePathStem.replace(/\.(en|zh)$/, ""),
	},
};
