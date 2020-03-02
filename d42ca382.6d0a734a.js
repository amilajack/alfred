(window.webpackJsonp=window.webpackJsonp||[]).push([[25],{162:function(e,n,t){"use strict";t.r(n),t.d(n,"frontMatter",(function(){return l})),t.d(n,"metadata",(function(){return o})),t.d(n,"rightToc",(function(){return s})),t.d(n,"default",(function(){return p}));var r=t(1),i=t(10),a=(t(0),t(169)),l={id:"skill-transforms",title:"Transforms"},o={id:"skill-transforms",title:"Transforms",description:"The following is a basic example of a skill:",source:"@site/docs/skill-transforms.md",permalink:"/docs/skill-transforms",sidebar:"docs",previous:{title:"Skills",permalink:"/docs/skills"},next:{title:"Dependencies",permalink:"/docs/skill-dependencies"}},s=[{value:"Configs",id:"configs",children:[]},{value:"Transforms",id:"transforms",children:[]}],c={rightToc:s};function p(e){var n=e.components,t=Object(i.a)(e,["components"]);return Object(a.b)("wrapper",Object(r.a)({},c,t,{components:n,mdxType:"MDXLayout"}),Object(a.b)("p",null,"The following is a basic example of a skill:"),Object(a.b)("pre",null,Object(a.b)("code",Object(r.a)({parentName:"pre"},{className:"language-js"}),"const skill = {\n  name: 'eslint',\n  devDependencies: {\n    'eslint-config-airbnb': '18.0.0'\n  },\n  configs: [\n    {\n      alias: 'eslint',\n      filename: '.eslintrc.js',\n      config: {\n        plugins: [\n          'eslint-plugin-prettier'\n        ]\n      }\n    }\n  ],\n  transforms: {\n    react(eslintSkill) {\n      return eslintSkill\n        .extendConfig('eslint', {\n          plugins: [\n            'eslint-plugin-react'\n          ]\n        })\n        .addDevDeps({\n          'eslint-plugin-react': '7.18.0'\n        });\n    }\n  }\n};\n\nexport default skill;\n")),Object(a.b)("h2",{id:"configs"},"Configs"),Object(a.b)("p",null,"Configs are added through the ",Object(a.b)("inlineCode",{parentName:"p"},"configs")," property. Each config can have an optional ",Object(a.b)("inlineCode",{parentName:"p"},"alias")," which makes it easy to reference them in transforms. If no ",Object(a.b)("inlineCode",{parentName:"p"},"alias")," is provided, configs must be referenced in transforms by their ",Object(a.b)("inlineCode",{parentName:"p"},"filename"),". The ",Object(a.b)("inlineCode",{parentName:"p"},"config")," property is the value of the initial config before any transformations are applied."),Object(a.b)("h2",{id:"transforms"},"Transforms"),Object(a.b)("p",null,"Transforms are what transform the skill's config to be compatible with another skill. In the example above, the ",Object(a.b)("inlineCode",{parentName:"p"},"react")," transform is transforming the ",Object(a.b)("inlineCode",{parentName:"p"},"eslint")," skill's config to be compatible with the ",Object(a.b)("inlineCode",{parentName:"p"},"eslint")," skill. Transforms always transform their own configs. They also always return a the finally transformed skill."),Object(a.b)("p",null,"So transforms take a skill as input and return a skill as output."),Object(a.b)("h4",{id:"extending-configs"},"Extending Configs"),Object(a.b)("p",null,"Alfred skills have helpers functions that make writing skills easy. The ",Object(a.b)("inlineCode",{parentName:"p"},"extendConfig")," helper allows you to extend configs."),Object(a.b)("h4",{id:"serializing-configs"},"Serializing Configs"),Object(a.b)("p",null,"Serializing configs which cannot be serialized easily. This is done with the ",Object(a.b)("inlineCode",{parentName:"p"},"serialize"),". Here is an example:"),Object(a.b)("pre",null,Object(a.b)("code",Object(r.a)({parentName:"pre"},{className:"language-js",metastring:"{9-12}","{9-12}":!0}),"const webpackSkill = {\n  name: 'webpack',\n  // ...\n  transforms: {\n    lodash(skill: Skill): Skill {\n      return skill\n        .extendConfig('webpack.prod', {\n          plugins: [\n            configStringify`(() => {\n              const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');\n              return new LodashModuleReplacementPlugin()\n            })()`\n          ]\n        })\n        .addDepsFromPkg('lodash-webpack-plugin');\n    }\n  }\n}\n\nexport default skill;\n")))}p.isMDXComponent=!0},169:function(e,n,t){"use strict";t.d(n,"a",(function(){return f})),t.d(n,"b",(function(){return d}));var r=t(0),i=t.n(r);function a(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function l(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function o(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?l(Object(t),!0).forEach((function(n){a(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):l(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function s(e,n){if(null==e)return{};var t,r,i=function(e,n){if(null==e)return{};var t,r,i={},a=Object.keys(e);for(r=0;r<a.length;r++)t=a[r],n.indexOf(t)>=0||(i[t]=e[t]);return i}(e,n);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)t=a[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(i[t]=e[t])}return i}var c=i.a.createContext({}),p=function(e){var n=i.a.useContext(c),t=n;return e&&(t="function"==typeof e?e(n):o({},n,{},e)),t},f=function(e){var n=p(e.components);return i.a.createElement(c.Provider,{value:n},e.children)},u={inlineCode:"code",wrapper:function(e){var n=e.children;return i.a.createElement(i.a.Fragment,{},n)}},b=Object(r.forwardRef)((function(e,n){var t=e.components,r=e.mdxType,a=e.originalType,l=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),f=p(t),b=r,d=f["".concat(l,".").concat(b)]||f[b]||u[b]||a;return t?i.a.createElement(d,o({ref:n},c,{components:t})):i.a.createElement(d,o({ref:n},c))}));function d(e,n){var t=arguments,r=n&&n.mdxType;if("string"==typeof e||r){var a=t.length,l=new Array(a);l[0]=b;var o={};for(var s in n)hasOwnProperty.call(n,s)&&(o[s]=n[s]);o.originalType=e,o.mdxType="string"==typeof e?e:r,l[1]=o;for(var c=2;c<a;c++)l[c]=t[c];return i.a.createElement.apply(null,l)}return i.a.createElement.apply(null,t)}b.displayName="MDXCreateElement"}}]);