(window.webpackJsonp=window.webpackJsonp||[]).push([[19],{159:function(e,t,a){"use strict";a.r(t),a.d(t,"frontMatter",(function(){return i})),a.d(t,"metadata",(function(){return c})),a.d(t,"rightToc",(function(){return s})),a.d(t,"default",(function(){return o}));var l=a(1),n=a(10),r=(a(0),a(173)),i={id:"skills",title:"Skills"},c={id:"skills",title:"Skills",description:"## What is a 'Skill'?",source:"@site/docs/skills.md",permalink:"/docs/skills",editUrl:"https://github.com/amilajack/alfred/edit/master/website/docs/skills.md",sidebar:"docs",previous:{title:"Concepts",permalink:"/docs/concepts"},next:{title:"Creating a Skill",permalink:"/docs/creating-a-skill"}},s=[{value:"What is a &#39;Skill&#39;?",id:"what-is-a-skill",children:[]},{value:"Adding Skills",id:"adding-skills",children:[{value:"Skills with Subcommands",id:"skills-with-subcommands",children:[]}]},{value:"Using Skills",id:"using-skills",children:[{value:"Extending Skill Configs",id:"extending-skill-configs",children:[]},{value:"Passing Command Line Flags to Skills",id:"passing-command-line-flags-to-skills",children:[]}]}],b={rightToc:s};function o(e){var t=e.components,a=Object(n.a)(e,["components"]);return Object(r.b)("wrapper",Object(l.a)({},b,a,{components:t,mdxType:"MDXLayout"}),Object(r.b)("h2",{id:"what-is-a-skill"},"What is a 'Skill'?"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"A 'skill' is an object that wrappers a tool such as Webpack, ESLint, Babel, and others"),Object(r.b)("li",{parentName:"ul"},"It decides how the tool's configuration is changed so it can work with other tools"),Object(r.b)("li",{parentName:"ul"},"Skills can be run by a subcommand they specify. For example, the ",Object(r.b)("inlineCode",{parentName:"li"},"@alfred/skill-webpack")," skill is run with the ",Object(r.b)("inlineCode",{parentName:"li"},"build")," subcommand it registers"),Object(r.b)("li",{parentName:"ul"},"Alfred has default skills that can be overriden")),Object(r.b)("h2",{id:"adding-skills"},"Adding Skills"),Object(r.b)("p",null,"To use a skill in your project, use the ",Object(r.b)("inlineCode",{parentName:"p"},"alfred learn <skill-pkg-name>")," command, where ",Object(r.b)("inlineCode",{parentName:"p"},"skill-pkg-name")," is the package name of the skill you want to install."),Object(r.b)("p",null,"Here are a few examples of learning a skill:"),Object(r.b)("pre",null,Object(r.b)("code",Object(l.a)({parentName:"pre"},{className:"language-bash"}),"# Installing a skill\nalfred learn @alfred/skill-lodash\n\n# Installing multiple skills\nalfred learn @alfred/skill-react @alfred/skill-redux\n")),Object(r.b)("h3",{id:"skills-with-subcommands"},"Skills with Subcommands"),Object(r.b)("p",null,"Alfred comes with default skills. Below is a table of how these skills and which subcommands and targets they support."),Object(r.b)("table",null,Object(r.b)("thead",{parentName:"table"},Object(r.b)("tr",{parentName:"thead"},Object(r.b)("th",Object(l.a)({parentName:"tr"},{align:null}),"Default Skills"),Object(r.b)("th",Object(l.a)({parentName:"tr"},{align:null}),"Subcommands"),Object(r.b)("th",Object(l.a)({parentName:"tr"},{align:null}),"Targets"))),Object(r.b)("tbody",{parentName:"table"},Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),Object(r.b)("a",Object(l.a)({parentName:"td"},{href:"https://github.com/amilajack/alfred/tree/master/packages/skill-parcel"}),Object(r.b)("inlineCode",{parentName:"a"},"@alfred/skill-parcel"))),Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),"start, build"),Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),"app")),Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),Object(r.b)("a",Object(l.a)({parentName:"td"},{href:"https://github.com/amilajack/alfred/tree/master/packages/skill-rollup"}),Object(r.b)("inlineCode",{parentName:"a"},"@alfred/skill-rollup"))),Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),"build"),Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),"lib")),Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),Object(r.b)("a",Object(l.a)({parentName:"td"},{href:"https://github.com/amilajack/alfred/tree/master/packages/skill-eslint"}),Object(r.b)("inlineCode",{parentName:"a"},"@alfred/skill-eslint"))),Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),"lint"),Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),"lib")),Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),Object(r.b)("a",Object(l.a)({parentName:"td"},{href:"https://github.com/amilajack/alfred/tree/master/packages/skill-prettier"}),Object(r.b)("inlineCode",{parentName:"a"},"@alfred/skill-prettier"))),Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),"format"),Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),"app, lib")),Object(r.b)("tr",{parentName:"tbody"},Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),Object(r.b)("a",Object(l.a)({parentName:"td"},{href:"https://github.com/amilajack/alfred/tree/master/packages/skill-jest"}),Object(r.b)("inlineCode",{parentName:"a"},"@alfred/skill-test"))),Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),"test"),Object(r.b)("td",Object(l.a)({parentName:"tr"},{align:null}),"app, lib")))),Object(r.b)("p",null,"Learning a skill can either replace or add subcommands to a project. For example, if you want to use webpack instead of parcel, you can run ",Object(r.b)("inlineCode",{parentName:"p"},"alfred learn @alfred/skill-webpack"),". Since both webpack and parcel support the ",Object(r.b)("inlineCode",{parentName:"p"},"build")," and ",Object(r.b)("inlineCode",{parentName:"p"},"start")," subcommands and parcel is a default skill, webpack will override parcel. Future calls to ",Object(r.b)("inlineCode",{parentName:"p"},"alfred run build")," and ",Object(r.b)("inlineCode",{parentName:"p"},"alfred run start")," will now use webpack instead of parcel."),Object(r.b)("h2",{id:"using-skills"},"Using Skills"),Object(r.b)("h3",{id:"extending-skill-configs"},"Extending Skill Configs"),Object(r.b)("pre",null,Object(r.b)("code",Object(l.a)({parentName:"pre"},{className:"language-json"}),'// package.json\n{\n  // ...\n  "alfred": {\n    "skills": [\n      ["@alfred/skill-eslint", {\n        "extends": "airbnb",\n        "rules": {\n          "no-console": "off"\n        }\n      }]\n    ]\n  }\n}\n')),Object(r.b)("h3",{id:"passing-command-line-flags-to-skills"},"Passing Command Line Flags to Skills"),Object(r.b)("p",null,"The following example passes flags to eslint. The example adds a custom formatter to eslint."),Object(r.b)("pre",null,Object(r.b)("code",Object(l.a)({parentName:"pre"},{className:"language-bash"}),"alfred run lint --format pretty\n")))}o.isMDXComponent=!0},173:function(e,t,a){"use strict";a.d(t,"a",(function(){return p})),a.d(t,"b",(function(){return m}));var l=a(0),n=a.n(l);function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function i(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);t&&(l=l.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,l)}return a}function c(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?i(Object(a),!0).forEach((function(t){r(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):i(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function s(e,t){if(null==e)return{};var a,l,n=function(e,t){if(null==e)return{};var a,l,n={},r=Object.keys(e);for(l=0;l<r.length;l++)a=r[l],t.indexOf(a)>=0||(n[a]=e[a]);return n}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(l=0;l<r.length;l++)a=r[l],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(n[a]=e[a])}return n}var b=n.a.createContext({}),o=function(e){var t=n.a.useContext(b),a=t;return e&&(a="function"==typeof e?e(t):c({},t,{},e)),a},p=function(e){var t=o(e.components);return n.a.createElement(b.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return n.a.createElement(n.a.Fragment,{},t)}},u=Object(l.forwardRef)((function(e,t){var a=e.components,l=e.mdxType,r=e.originalType,i=e.parentName,b=s(e,["components","mdxType","originalType","parentName"]),p=o(a),u=l,m=p["".concat(i,".").concat(u)]||p[u]||d[u]||r;return a?n.a.createElement(m,c({ref:t},b,{components:a})):n.a.createElement(m,c({ref:t},b))}));function m(e,t){var a=arguments,l=t&&t.mdxType;if("string"==typeof e||l){var r=a.length,i=new Array(r);i[0]=u;var c={};for(var s in t)hasOwnProperty.call(t,s)&&(c[s]=t[s]);c.originalType=e,c.mdxType="string"==typeof e?e:l,i[1]=c;for(var b=2;b<r;b++)i[b]=a[b];return n.a.createElement.apply(null,i)}return n.a.createElement.apply(null,a)}u.displayName="MDXCreateElement"}}]);