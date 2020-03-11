(window.webpackJsonp=window.webpackJsonp||[]).push([[29],{167:function(e,t,r){"use strict";r.r(t),r.d(t,"frontMatter",(function(){return i})),r.d(t,"metadata",(function(){return o})),r.d(t,"rightToc",(function(){return l})),r.d(t,"default",(function(){return p}));var n=r(1),a=r(10),c=(r(0),r(173)),i={id:"getting-started",title:"Getting Started"},o={id:"getting-started",title:"Getting Started",description:"```bash",source:"@site/docs/getting-started.md",permalink:"/docs/getting-started",editUrl:"https://github.com/amilajack/alfred/edit/master/website/docs/getting-started.md",sidebar:"docs",next:{title:"Command Line Interface",permalink:"/docs/cli"}},l=[{value:"Learning Skills",id:"learning-skills",children:[]},{value:"Community",id:"community",children:[]}],u={rightToc:l};function p(e){var t=e.components,r=Object(a.a)(e,["components"]);return Object(c.b)("wrapper",Object(n.a)({},u,r,{components:t,mdxType:"MDXLayout"}),Object(c.b)("pre",null,Object(c.b)("code",Object(n.a)({parentName:"pre"},{className:"language-bash"}),"# Create a new project\nNPM_CONFIG_REGISTRY=https://amilajack.com/registry npx alfred new project\ncd my-project\n\n# Build your project\nNPM_CONFIG_REGISTRY=https://amilajack.com/registry npx alfred run build\n")),Object(c.b)("p",null,"For migrating to Alfred, see ",Object(c.b)("a",Object(n.a)({parentName:"p"},{href:"migrating-to-alfred"}),"the migrating guide")),Object(c.b)("h2",{id:"learning-skills"},"Learning Skills"),Object(c.b)("pre",null,Object(c.b)("code",Object(n.a)({parentName:"pre"},{className:"language-bash"}),"# Learning skills\nalfred learn @alfred/skill-react @alfred/skill-redux\n")),Object(c.b)("h2",{id:"community"},"Community"),Object(c.b)("p",null,"All feedback and suggestions are welcome!"),Object(c.b)("ul",null,Object(c.b)("li",{parentName:"ul"},"\ud83d\udcac Join the community on ",Object(c.b)("a",Object(n.a)({parentName:"li"},{href:"https://spectrum.chat/alfred"}),"Spectrum")),Object(c.b)("li",{parentName:"ul"},"\ud83d\udce3 Stay up to date on new features and announcements on ",Object(c.b)("a",Object(n.a)({parentName:"li"},{href:"https://twitter.com/alfredpkg"}),"@alfredpkg"),".")))}p.isMDXComponent=!0},173:function(e,t,r){"use strict";r.d(t,"a",(function(){return s})),r.d(t,"b",(function(){return m}));var n=r(0),a=r.n(n);function c(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){c(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},c=Object.keys(e);for(n=0;n<c.length;n++)r=c[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(n=0;n<c.length;n++)r=c[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var u=a.a.createContext({}),p=function(e){var t=a.a.useContext(u),r=t;return e&&(r="function"==typeof e?e(t):o({},t,{},e)),r},s=function(e){var t=p(e.components);return a.a.createElement(u.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.a.createElement(a.a.Fragment,{},t)}},b=Object(n.forwardRef)((function(e,t){var r=e.components,n=e.mdxType,c=e.originalType,i=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),s=p(r),b=n,m=s["".concat(i,".").concat(b)]||s[b]||d[b]||c;return r?a.a.createElement(m,o({ref:t},u,{components:r})):a.a.createElement(m,o({ref:t},u))}));function m(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var c=r.length,i=new Array(c);i[0]=b;var o={};for(var l in t)hasOwnProperty.call(t,l)&&(o[l]=t[l]);o.originalType=e,o.mdxType="string"==typeof e?e:n,i[1]=o;for(var u=2;u<c;u++)i[u]=r[u];return a.a.createElement.apply(null,i)}return a.a.createElement.apply(null,r)}b.displayName="MDXCreateElement"}}]);