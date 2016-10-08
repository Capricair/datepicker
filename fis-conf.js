fis.config.merge({
	project: {
		exclude:[
			"**.sln", 
			"**.suo", 
			"**.config", 
			"**.cmd", 
			"**.rar",
			/readme\.md/i,
			/\/\.idea\//i, 
			/\/\.git\//i
		],
		fileType: {
			text: ["es6", "shtml"]
		}
	},
	modules: {
		postpackager: "simple",
		postprocessor: {
			css: "autoprefixer"
		},
		spriter: "csssprites",
		parser: {
			less : "less",
			sass : "node-sass",
			scss : "node-sass",
			jsx  : ["babel-5.x", "react"],
			es6  : "babel-5.x"
		}
	},
	pack: {
		"pkg/css/base.css": [
			"css/base/reset.css",
			"css/base/base.scss",
		],
		"pkg/css/main.css": [
			"css/fonts/icomoon/style.css",
			"css/struct/custom.scss",
			"css/struct/layout.scss"
		],
		"pkg/js/lib.js": [
			"js/jquery/jquery-1.11.2.js",
			"js/fastclick/fastclick.js"
		]
	},
	settings: {
		spriter: {
			csssprites: {
				margin: 5
			}
		},
		parser: {
			"babel-5.x": {
				blacklist: ["regenerator"],
				optional: ["es7.classProperties"],
				stage: 3,
				sourceMaps: true
			}
		},
		postprocessor: {
			autoprefixer: {
				browsers: ["Android >= 2.3", "ChromeAndroid > 1%", "iOS >= 4"],
				cascade: true
			}
		},
		optimizer: {
			"uglify-js": {
				sourceMap: true
			}
		}
	},
	roadmap: {
		ext: {
			less : "css",
			sass : "css",
			scss : "css",
			jsx  : "js",
			es6  : "js"
		},
		path: [
			{
				reg: /\/src\/(.*?)\.(.*?)/i,
				release: "$1",
				url: "$1",
			}
		]
	}
});