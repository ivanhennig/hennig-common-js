'use strict';//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
var script = {
  name: 'BaseModal',
  props: {
    title: {
      String
    },
    size: {
      String,
      default: 'modal-lg'
    },
    backdrop: {
      Boolean,
      default: 'static'
    }
  },

  data() {
    return {};
  },

  methods: {
    show(callback) {
      $(this.$el).modal({
        backdrop: this.backdrop
      });
      this.callback = callback;
    },

    hide() {
      $(this.$el).modal('hide');
      if (this.callback) this.callback(false);
    }

  }
};function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    const options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    let hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            const originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            const existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}function createInjectorSSR(context) {
    if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
    }
    if (!context)
        return () => { };
    if (!('styles' in context)) {
        context._styles = context._styles || {};
        Object.defineProperty(context, 'styles', {
            enumerable: true,
            get: () => context._renderStyles(context._styles)
        });
        context._renderStyles = context._renderStyles || renderStyles;
    }
    return (id, style) => addStyle(id, style, context);
}
function addStyle(id, css, context) {
    const group = css.media || 'default' ;
    const style = context._styles[group] || (context._styles[group] = { ids: [], css: '' });
    if (!style.ids.includes(id)) {
        style.media = css.media;
        style.ids.push(id);
        let code = css.source;
        style.css += code + '\n';
    }
}
function renderStyles(styles) {
    let css = '';
    for (const key in styles) {
        const style = styles[key];
        css +=
            '<style data-vue-ssr-id="' +
                Array.from(style.ids).join(' ') +
                '"' +
                (style.media ? ' media="' + style.media + '"' : '') +
                '>' +
                style.css +
                '</style>';
    }
    return css;
}/* script */
const __vue_script__ = script;
/* template */

var __vue_render__ = function () {
  var _vm = this;

  var _h = _vm.$createElement;

  var _c = _vm._self._c || _h;

  return _c('div', {
    staticClass: "modal",
    attrs: {
      "tabindex": "-1"
    }
  }, [_vm._ssrNode("<div" + _vm._ssrClass("modal-dialog modal-dialog-centered", [_vm.size]) + " data-v-5c1ac0c2>", "</div>", [_vm._ssrNode("<div class=\"modal-content\" data-v-5c1ac0c2>", "</div>", [_vm._ssrNode("<div class=\"modal-header\" data-v-5c1ac0c2>", "</div>", [_vm._t("header", [_c('h5', {
    staticClass: "modal-title"
  }, [_c('i', {
    staticClass: "la la-info-circle"
  }), _vm._v("\n                        " + _vm._s(_vm.title) + "\n                    ")])]), _vm._ssrNode(" <div class=\"close link\" data-v-5c1ac0c2><span aria-hidden=\"true\" data-v-5c1ac0c2>×</span></div>")], 2), _vm._ssrNode(" "), _vm._ssrNode("<div class=\"modal-body scroll-styled\" data-v-5c1ac0c2>", "</div>", [_vm._t("default")], 2), _vm._ssrNode(" "), _vm._ssrNode("<div class=\"modal-footer\" data-v-5c1ac0c2>", "</div>", [_vm._t("footer")], 2)], 2)])]);
};

var __vue_staticRenderFns__ = [];
/* style */

const __vue_inject_styles__ = function (inject) {
  if (!inject) return;
  inject("data-v-5c1ac0c2_0", {
    source: ".modal-body[data-v-5c1ac0c2]{overflow:auto}",
    map: undefined,
    media: undefined
  });
};
/* scoped */


const __vue_scope_id__ = "data-v-5c1ac0c2";
/* module identifier */

const __vue_module_identifier__ = "data-v-5c1ac0c2";
/* functional template */

const __vue_is_functional_template__ = false;
/* style inject shadow dom */

const __vue_component__ = /*#__PURE__*/normalizeComponent({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, undefined, createInjectorSSR, undefined);var components$1=/*#__PURE__*/Object.freeze({__proto__:null,BaseModal: __vue_component__});// Import vue components

const install = function installHennigCommonVue(Vue) {
  Object.entries(components$1).forEach(([componentName, component]) => {
    Vue.component(componentName, component);
  });
}; // Create module definition for Vue.use()
var components=/*#__PURE__*/Object.freeze({__proto__:null,'default': install,BaseModal: __vue_component__});// iife/cjs usage extends esm default export - so import it all
// only expose one global var, with component exports exposed as properties of
// that global var (eg. plugin.component)

Object.entries(components).forEach(([componentName, component]) => {
  if (componentName !== 'default') {
    install[componentName] = component;
  }
});module.exports=install;