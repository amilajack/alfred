(window.webpackJsonp=window.webpackJsonp||[]).push([[6],{140:function(e,t,r){"use strict";r.r(t),r.d(t,"frontMatter",(function(){return i})),r.d(t,"metadata",(function(){return o})),r.d(t,"rightToc",(function(){return c})),r.d(t,"default",(function(){return b}));var n=r(1),a=r(10),l=(r(0),r(169)),i={id:"cli",title:"Command Line Interface"},o={id:"cli",title:"Command Line Interface",description:"# Commands",source:"@site/docs/cli.md",permalink:"/docs/cli",sidebar:"docs",previous:{title:"Getting Started",permalink:"/docs/getting-started"},next:{title:"Configuration",permalink:"/docs/configuration"}},c=[{value:"<code>alfred new &lt;project-name&gt;</code>",id:"alfred-new-project-name",children:[]},{value:"<code>alfred learn &lt;skill-pkg&gt;</code>",id:"alfred-learn-skill-pkg",children:[]},{value:"<code>alfred skills</code>",id:"alfred-skills",children:[]},{value:"<code>alfred run &lt;task&gt;</code>",id:"alfred-run-task",children:[]},{value:"<code>alfred run start</code>",id:"alfred-run-start",children:[]},{value:"<code>alfred run build</code>",id:"alfred-run-build",children:[]},{value:"<code>alfred run test</code>",id:"alfred-run-test",children:[]},{value:"<code>alfred run format</code>",id:"alfred-run-format",children:[]},{value:"<code>alfred run lint</code>",id:"alfred-run-lint",children:[]}],d={rightToc:c};function b(e){var t=e.components,r=Object(a.a)(e,["components"]);return Object(l.b)("wrapper",Object(n.a)({},d,r,{components:t,mdxType:"MDXLayout"}),Object(l.b)("h1",{id:"commands"},"Commands"),Object(l.b)("h3",{id:"alfred-new-project-name"},Object(l.b)("inlineCode",{parentName:"h3"},"alfred new <project-name>")),Object(l.b)("p",null,"Create a new Alfred project. This will allow you to choose which skills you want to bootstrap your Alfred app with."),Object(l.b)("pre",null,Object(l.b)("code",Object(n.a)({parentName:"pre"},{className:"language-bash"}),"alfred new my-project\n")),Object(l.b)("h3",{id:"alfred-learn-skill-pkg"},Object(l.b)("inlineCode",{parentName:"h3"},"alfred learn <skill-pkg>")),Object(l.b)("p",null,"Tell Alfred to learn new skills. When running ",Object(l.b)("inlineCode",{parentName:"p"},"alfred learn @alfred/skill-react"),", Alfred will transform other existing skills such as webpack, babel, and rollup."),Object(l.b)("pre",null,Object(l.b)("code",Object(n.a)({parentName:"pre"},{className:"language-bash"}),"alfred learn @alfred/skill-react @alfred/skill-redux\n")),Object(l.b)("h3",{id:"alfred-skills"},Object(l.b)("inlineCode",{parentName:"h3"},"alfred skills")),Object(l.b)("p",null,"List all the skills Alfred knows for a specific project."),Object(l.b)("h3",{id:"alfred-run-task"},Object(l.b)("inlineCode",{parentName:"h3"},"alfred run <task>")),Object(l.b)("p",null,"Run a task. You can optionally pass flags directly to the skills. Here is an example of passing ESLint's ",Object(l.b)("a",Object(n.a)({parentName:"p"},{href:"https://eslint.org/docs/user-guide/command-line-interface#f-format"}),Object(l.b)("inlineCode",{parentName:"a"},"--format")," flag"),":"),Object(l.b)("pre",null,Object(l.b)("code",Object(n.a)({parentName:"pre"},{className:"language-bash"}),"# Example of passing eslint cli flags to eslint alfred skill\nalfred run lint --format pretty\n")),Object(l.b)("h1",{id:"built-in-tasks"},"Built-in Tasks"),Object(l.b)("h3",{id:"alfred-run-start"},Object(l.b)("inlineCode",{parentName:"h3"},"alfred run start")),Object(l.b)("p",null,"Start a development workflow of an Alfred project."),Object(l.b)("h3",{id:"alfred-run-build"},Object(l.b)("inlineCode",{parentName:"h3"},"alfred run build")),Object(l.b)("p",null,"Build your Alfred project. You can build the production build by passing the ",Object(l.b)("inlineCode",{parentName:"p"},"--prod")," flag like so: ",Object(l.b)("inlineCode",{parentName:"p"},"alfred run build --prod"),". By default, if ",Object(l.b)("inlineCode",{parentName:"p"},"NODE_ENV")," is set to ",Object(l.b)("inlineCode",{parentName:"p"},"production"),", the task will be called with the ",Object(l.b)("inlineCode",{parentName:"p"},"--prod")," flag."),Object(l.b)("p",null,"In the case that you have multiple entrypoints, such as ",Object(l.b)("inlineCode",{parentName:"p"},"app.browser.js")," and ",Object(l.b)("inlineCode",{parentName:"p"},"lib.browser.js"),", Alfred will build both targets."),Object(l.b)("pre",null,Object(l.b)("code",Object(n.a)({parentName:"pre"},{className:"language-bash"}),"alfred run build --prod\nalfred run build --dev\n")),Object(l.b)("h3",{id:"alfred-run-test"},Object(l.b)("inlineCode",{parentName:"h3"},"alfred run test")),Object(l.b)("p",null,"Run tests all the tests of your Alfred project."),Object(l.b)("h3",{id:"alfred-run-format"},Object(l.b)("inlineCode",{parentName:"h3"},"alfred run format")),Object(l.b)("p",null,"Format all the code in the ",Object(l.b)("inlineCode",{parentName:"p"},"src")," directory of your Alfred project."),Object(l.b)("h3",{id:"alfred-run-lint"},Object(l.b)("inlineCode",{parentName:"h3"},"alfred run lint")),Object(l.b)("p",null,"Lint all the code in the ",Object(l.b)("inlineCode",{parentName:"p"},"src")," directory of your Alfred project."))}b.isMDXComponent=!0},169:function(e,t,r){"use strict";r.d(t,"a",(function(){return p})),r.d(t,"b",(function(){return f}));var n=r(0),a=r.n(n);function l(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){l(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function c(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},l=Object.keys(e);for(n=0;n<l.length;n++)r=l[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(n=0;n<l.length;n++)r=l[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var d=a.a.createContext({}),b=function(e){var t=a.a.useContext(d),r=t;return e&&(r="function"==typeof e?e(t):o({},t,{},e)),r},p=function(e){var t=b(e.components);return a.a.createElement(d.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return a.a.createElement(a.a.Fragment,{},t)}},s=Object(n.forwardRef)((function(e,t){var r=e.components,n=e.mdxType,l=e.originalType,i=e.parentName,d=c(e,["components","mdxType","originalType","parentName"]),p=b(r),s=n,f=p["".concat(i,".").concat(s)]||p[s]||u[s]||l;return r?a.a.createElement(f,o({ref:t},d,{components:r})):a.a.createElement(f,o({ref:t},d))}));function f(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var l=r.length,i=new Array(l);i[0]=s;var o={};for(var c in t)hasOwnProperty.call(t,c)&&(o[c]=t[c]);o.originalType=e,o.mdxType="string"==typeof e?e:n,i[1]=o;for(var d=2;d<l;d++)i[d]=r[d];return a.a.createElement.apply(null,i)}return a.a.createElement.apply(null,r)}s.displayName="MDXCreateElement"}}]);