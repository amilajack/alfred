(window.webpackJsonp=window.webpackJsonp||[]).push([[15],{155:function(e,n,t){"use strict";t.r(n),t.d(n,"frontMatter",(function(){return a})),t.d(n,"metadata",(function(){return c})),t.d(n,"rightToc",(function(){return s})),t.d(n,"default",(function(){return l}));var r=t(1),i=t(10),o=(t(0),t(173)),a={id:"skill-dependencies",title:"Dependencies"},c={id:"skill-dependencies",title:"Dependencies",description:"*This doc is a work in progress. Contributions welcome!*",source:"@site/docs/skill-dependencies.md",permalink:"/docs/skill-dependencies",editUrl:"https://github.com/amilajack/alfred/edit/master/website/docs/skill-dependencies.md",sidebar:"docs",previous:{title:"Transforms",permalink:"/docs/skill-transforms"},next:{title:"Hooks",permalink:"/docs/skill-hooks"}},s=[],p={rightToc:s};function l(e){var n=e.components,t=Object(i.a)(e,["components"]);return Object(o.b)("wrapper",Object(r.a)({},p,t,{components:n,mdxType:"MDXLayout"}),Object(o.b)("p",null,Object(o.b)("em",{parentName:"p"},"This doc is a work in progress. Contributions welcome!")),Object(o.b)("p",null,Object(o.b)("inlineCode",{parentName:"p"},"peerDependencies")," are specified in the ",Object(o.b)("inlineCode",{parentName:"p"},"package.json")," of a skill. They are not ",Object(o.b)("inlineCode",{parentName:"p"},"dependencies")," because by determining dependencies in skills, they can be extended. Users can write their own skills to customize which dependencies they want installed. Customizing dependencies, however, should be considered an antipattern because they use versions of a dependency that may not be supported by a skill."),Object(o.b)("pre",null,Object(o.b)("code",Object(r.a)({parentName:"pre"},{className:"language-json"}),'// package.json\n{\n  "name": "@alfred/skill-parcel",\n  "peerDependencies": {\n    "react": "^16.0.0"\n  }\n}\n')))}l.isMDXComponent=!0},173:function(e,n,t){"use strict";t.d(n,"a",(function(){return d})),t.d(n,"b",(function(){return f}));var r=t(0),i=t.n(r);function o(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function a(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function c(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?a(Object(t),!0).forEach((function(n){o(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):a(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function s(e,n){if(null==e)return{};var t,r,i=function(e,n){if(null==e)return{};var t,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||(i[t]=e[t]);return i}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(i[t]=e[t])}return i}var p=i.a.createContext({}),l=function(e){var n=i.a.useContext(p),t=n;return e&&(t="function"==typeof e?e(n):c({},n,{},e)),t},d=function(e){var n=l(e.components);return i.a.createElement(p.Provider,{value:n},e.children)},u={inlineCode:"code",wrapper:function(e){var n=e.children;return i.a.createElement(i.a.Fragment,{},n)}},b=Object(r.forwardRef)((function(e,n){var t=e.components,r=e.mdxType,o=e.originalType,a=e.parentName,p=s(e,["components","mdxType","originalType","parentName"]),d=l(t),b=r,f=d["".concat(a,".").concat(b)]||d[b]||u[b]||o;return t?i.a.createElement(f,c({ref:n},p,{components:t})):i.a.createElement(f,c({ref:n},p))}));function f(e,n){var t=arguments,r=n&&n.mdxType;if("string"==typeof e||r){var o=t.length,a=new Array(o);a[0]=b;var c={};for(var s in n)hasOwnProperty.call(n,s)&&(c[s]=n[s]);c.originalType=e,c.mdxType="string"==typeof e?e:r,a[1]=c;for(var p=2;p<o;p++)a[p]=t[p];return i.a.createElement.apply(null,a)}return i.a.createElement.apply(null,t)}b.displayName="MDXCreateElement"}}]);