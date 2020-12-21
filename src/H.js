import Vue from 'vue'
import jQuery from 'jquery'
import {showError, showInfo, showSuccess} from './notifications'
import AutoNumeric from 'autonumeric'
import Inputmask from 'inputmask'

const TYP_NUMBER = 'number'
const TYP_TEXT = 'text'
const TYP_TEXTAREA = 'textarea'
const TYP_DATETIME = 'datetime'
const TYP_SELECT = 'select'
const ST_INTEGER = 'integer'
const ST_PASSWORD = 'password'
const ST_DATETIME = 'datetime'
const ST_DATE = 'date'
const ST_TIME = 'time'
const ST_EMAIL = 'email'

const H = new class {
    constructor () {
        this.prefix = ''
        this.sessionStorageKey = 'H'
        this.show = 'H.show'
        this.onstore = 'H.onstore'
        this.getValue = 'H.getValue'
        this.setValue = 'H.setValue'
        this.setActiveTab = 'H.setActiveTab'
        this.setValidation = 'H.setValidation'
        this.clearValidation = 'H.clearValidation'
        this.defaultAction = 'H.defaultAction'
        this.formInit = 'H.formInit'

        this.lang = {
            offlineError: 'Você está desconectado.',
            yes: 'Sim',
            no: 'Não'
        }

        this.init()
        if (window.Vue) {
            this.initVue(window.Vue)
        }
        if (window.jQuery) {
            this.initJQuery(window.jQuery)
        }
    }

    setup (options) {
        options = options || {}
        this.prefix = options.prefix || ''

        if (options.vue) {
            this.initVue(options.vue)
        }
    }

    init () {
        if ('scrollRestoration' in history) {
            // Back off, browser, I got this...
            history.scrollRestoration = 'manual'
        }
    }

    initVue (Vue) {
        this.Vue = Vue
        this.Vue.filter('formatDateTime', (value) => {
            return this.formatDatetime(value)
        })
    }

    initJQuery (jQuery) {
        this.jQuery = jQuery;
        // Override of val method of jQuery.
        // Will affect val(), serialize(), serializeArray(), serializeObject()
        (function ($) {// eslint-disable-line id-length
            // Serialize helper
            $.fn.serializeObject = function () {
                let dates = {}
                $.each(this.filter('.datetimepicker-input'), (index, element) => {
                    if ($(element).val()) {
                        dates[element.name] = $(element).datetimepicker('viewDate').toISOString(true)
                    } else {
                        dates[element.name] = ''
                    }
                })

                let result = {},
                    serializedArray = this.not('.datetimepicker-input').serializeArray()
                $.each(serializedArray, function () {
                    let name = this.name.replace('[]', '')
                    if (result[name]) {
                        if (!result[name].push) {
                            result[name] = [result[name]]
                        }
                        result[name].push(this.value || '')
                    } else {
                        result[name] = this.value || ''
                    }
                })
                return $.extend(result, dates)
            }
        })(jQuery)
    }

    /**
     * Init Moment and Tempus Dominus
     */
    initMoment () {
        window.moment.locale(window.g_locale)
    }

    initDateTimePicker () {
        $.fn.datetimepicker.Constructor.Default = $.extend({}, $.fn.datetimepicker.Constructor.Default, {
            icons: {
                time: 'la la-clock-o',
                date: 'la la-calendar',
                up: 'la la-arrow-up',
                down: 'la la-arrow-down',
                previous: 'la la-chevron-left',
                next: 'la la-chevron-right',
                today: 'la la-calendar-check-o',
                clear: 'la la-trash',
                close: 'la la-times'
            },
            useCurrent: false
        })
    }

    initNumeral () {
        window.numeral.locale(window.g_locale)
        window.g_current_locale = window.numeral.locales[window.g_locale]
    }

    /**
     *
     * @param {string} aclass
     * @param {string} amethod
     * @param {object} aparams
     * @param {function} acallback
     * @param progresscb
     */
    rpc (aclass, amethod, aparams, acallback, progresscb) {
        let l_callback = acallback || function (r, e) {
            console.info(r)
            console.error(e)
        }
        // if (!navigator.onLine) {
        //     l_callback(null, this.lang.offlineError);
        //     return;
        // }

        let l_process_json = (l_data) => {
            if ('method' in l_data) {//Servidor enviando comandos
                evalCode(l_data.method, l_data.params)
            } else if ('error' in l_data && l_data.error) {//Server sent an error
                if (l_data.error.trace) {
                    console.warn(l_data.error.trace)
                }

                let errorShow = l_callback(null, l_data.error)
                if (errorShow === undefined) {
                    this.showError(l_data.error.message)
                }
            } else if ('result' in l_data) {//Servidor enviando a resposta
                l_callback(l_data.result, null)
            }
        }

        let l_process = (lines) => {
            lines = lines.split(/\n/)
            for (let i in lines) {
                if (!lines.hasOwnProperty(i)) continue
                if (!lines[i]) continue
                let l_data
                try {
                    l_data = JSON.parse(lines[i])
                } catch (ex) {
                    return
                }

                l_process_json(l_data)
            }
        }

        let l_stop = false
        if (progresscb) {
            // Pooling for progress
            let l_progress = () => {
                $.ajax({
                    url: '/rpc/progress',
                    timeout: 10000,
                    async: true
                }).done(function (a_data, textStatus, xhr) {
                    progresscb()
                    if (l_stop) return
                    l_process(xhr.responseText)
                    setTimeout(l_progress, 1000)
                })
            }
            setTimeout(l_progress, 1000)
        }
        let lastResponseLength = 0
        let payload = JSON.stringify({
            method: amethod,
            params: aparams
        })
        if (this.jQuery && this.jQuery.ajax) {
            this.jQuery.ajax({
                url: `${this.prefix}rpc/${aclass}/${amethod}`,
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: payload,
                processData: false,
                async: true,
            }).fail(function (xhr, textStatus, errorThrown) {
                if (textStatus === 'parsererror') {
                    l_callback(null, {'message': xhr.responseText})
                } else {
                    l_callback(null, {'message': errorThrown})
                }
                l_stop = true
            }).done(function (a_data, textStatus, xhr) {
                l_process(xhr.responseText.substring(lastResponseLength))
                l_stop = true
            })
        } else {
            fetch(`${this.prefix}rpc/${aclass}/${amethod}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: payload
                })
                .then((r) => {
                    return r.json()
                })
                .then((r) => {
                    return l_process_json(r)
                })
        }
    }

    /**
     * Get coords
     *
     * @param callback
     */
    geoLocation (callback) {
        callback = callback || function (r, e) {
            console.info(r)
            console.error(e)
        }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (r) {
                    callback(r, null)
                },
                function (r) {
                    callback(null, r)
                }
            )
        } else {
            callback(null, 'No geolocation available.')
        }
    }

    sessionStorage (k, v) {
        var l_obj = {}
        try {
            l_obj = JSON.parse(window.sessionStorage[this.sessionStorageKey])
        } catch (e) {

        }
        if (typeof v === 'undefined') {//Get
            return l_obj[k] || {}
        } else {//Set
            l_obj[k] = v
            window.sessionStorage[this.sessionStorageKey] = JSON.stringify(l_obj)
        }
        return true
    }

    sessionStorageGet (k, def) {
        var l_obj = {}
        try {
            l_obj = JSON.parse(window.sessionStorage[this.sessionStorageKey])
        } catch (e) {

        }
        return l_obj[k] || def
    }

    sessionStorageSet (k, val) {
        let obj = {}
        try {
            obj = JSON.parse(window.sessionStorage[this.sessionStorageKey])
        } catch (e) {

        }

        obj[k] = val
        window.sessionStorage[this.sessionStorageKey] = JSON.stringify(obj)
        return true
    }

    formatNumber (v) {
        return window.numeral(v).format(',0.00')
    }

    formatCurrency (v) {
        return window.numeral(v).format('$,0.00')
    }

    formatDatetime (v) {
        return window.moment.utc(v || {}).local().format('L LTS')
    }

    /**
     * Serializes a container with many checkboxes
     *
     * @param a_container
     */
    serializeChecklist (a_container) {
        var l_data = {}
        a_container.find('input[type=checkbox]').each(function () {
            var $that = $(this)
            l_data[$that.val()] = $that.is(':checked')
        })
        return l_data
    }

    /**
     * Serialize using custom event handler
     *
     * @param a_container
     */
    serialize (a_container) {
        let H = this
        var l_data = {}
        a_container = this.find(a_container)
        a_container.find('.form-group').trigger(H.getValue, [l_data])
        return l_data
    }

    /**
     * Un-serialize using custom event handler
     *
     * @param a_container
     * @param a_data
     */
    unserialize (a_container, a_data) {
        let H = this
        a_container = this.find(a_container)
        a_container.find('.form-group').trigger(H.setValue, [a_data])
    }

    getBootstrapDevice () {
        if (window.innerWidth >= 1200) {
            return 'xl'
        }

        if (window.innerWidth >= 992) {
            return 'lg'
        }

        if (window.innerWidth >= 768) {
            return 'md'
        }

        if (window.innerWidth >= 576) {
            return 'sm'
        }

        return 'xs'
    }

    /**
     * Get the file content
     *
     * @param $elem
     * @param callback
     */
    fileAsBase64 ($elem, callback) {
        let file = $elem.get(0).files[0]
        let reader = new FileReader()
        reader.onload = function (el) {
            callback({
                name: file.name,
                size: file.size,
                content: el.target.result
            })
        }

        reader.readAsDataURL(file)
    }

    /**
     * Ask for confirmation
     * options
     *   default_answer: Default action when timeout
     *
     * @param msg
     * @param callback
     * @param options
     */
    showQuery (msg, callback, options) {
        let H = this
        callback = callback || function (r) {
            console.info(r)
        }

        options = options || {}

        let answer = options.default_answer || false
        options = $.extend({
            showProgressbar: false,
            animate: {
                enter: 'animated bounceIn',
                exit: 'hide'
            },
            placement: {
                from: 'top',
                align: 'center'
            },
            onClosed () {
                callback(answer)
            },
            z_index: 1051,
            template: `
<div 
    data-notify="container" 
    class="col-md-6 alert alert-{0}"
    style="max-width: 600px" 
    role="alert">
	<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>
	<span data-notify="icon"></span>
	<span data-notify="title">{1}</span>
	<span data-notify="message">{2}</span>
	<hr>
	<div class="row justify-content-center mt-2">
        <button 
            class="btn btn-outline-secondary col m-2 btn-1"
            style="min-width: 150px" 
            >
            ${H.lang.yes}
        </button>
        <button 
            class="btn btn-outline-secondary col m-2 btn-2"
            style="min-width: 150px"
            >
            ${H.lang.no}
        </button>
    </div>
</div>`
        }, options)

        let notify = $.notify({
            // title: 'Confirmação',
            message: msg
        }, options)
        notify.$ele.find('.btn-1').on('click', function () {
            answer = true
            notify.close()
        })
        notify.$ele.find('.btn-2').on('click', function () {
            answer = false
            notify.close()
        })
    }

    showSuccess (msg, options) {
        showSuccess(msg)
    }

    showInfo (msg, options) {
        showInfo(msg)
    }

    showError (msg, options) {
        showError(msg)
    }

    loadAssets (links, callback) {
        let deferreds = []
        for (let i in links) {
            if (!links.hasOwnProperty(i)) continue
            deferreds.push(this.loadAsset(links[i]))
        }

        Promise.all(deferreds).then(() => {
            callback()
        })
    }

    loadAsset (href) {
        this.loaded_assets = this.loaded_assets || {}
        var $d = $.Deferred()
        var l_key = btoa(href)

        if (this.loaded_assets[l_key]) {
            $d.resolve()
            return $d.promise()
        }

        this.loaded_assets[l_key] = true

        if (href.match(/\.css$|\.css\.gz$/)) {
            let el = document.createElement('link')
            el.type = 'text/css'
            el.rel = 'stylesheet'
            el.href = href
            el.onload = function () {
                $d.resolve()
            }
            document.head.appendChild(el)
        } else {
            let el = document.createElement('script')
            if (href.match(/^http/)) {
                el.crossOrigin = 'anonymous'
            }
            el.type = 'text/javascript'
            el.src = href
            el.onload = function () {
                $d.resolve()
            }
            document.head.appendChild(el)
        }

        return $d.promise()
    }

    carregarPagina (a_page, a_options) {
        let H = this

        if (window.g_app_error) {
            document.getElementsByTagName('body')[0].innerHTML = '<h1>Algo deu errado. Contate o suporte.</h1>'
            return
        }

        var l_options = a_options || {}
        var l_menu_h = $('#bg-menu').height()

        if (!a_page) {
            if (location.hash.match(/#/)) {
                a_page = location.hash.substring(1)
            } else {
                a_page = 'home'
            }
        }
        if (!a_page || (a_page === '')) {
            return
        }
        var l_page = a_page.split(/[\.\/]/).filter(function (r) {
            return !!r
        })
        if (!l_page.length) {
            return
        }
        var l_fn = function ($a_elem) {
            if ($a_elem.is('[data-oncreate]')) {//Apenas 1ª
                var l_method = $a_elem.data('oncreate')
                $a_elem.removeAttr('data-oncreate')
                evalCode(l_method, [$a_elem])
            }
            if ($a_elem.is('[data-onshow]')) {//Sempre q navegar até
                evalCode($a_elem.data('onshow'), [$a_elem, a_page])
            }

            $a_elem.trigger(H.show, [$a_elem, a_page])
        }
        $('a').toggleClass('active', false)
        $('.grecaptcha-badge').toggleClass('show', false)

        var l_refresh_active = function () {
            //Marca toda a arvore como active
            $('.header a[href]').filter(function () {
                var $that = $(this)
                var l_href = $that.attr('href')
                var l_page_regex = ''
                for (var i in l_page) {
                    l_page_regex += l_page[i] + '[/]?'
                    if (l_href.match(new RegExp('^#[/]?' + l_page_regex + '$'))) {

                        l_fn($that)

                        return true
                    }
                }
                return false
            }).toggleClass('active', true)
        }

        var lCurrent = $('body').scrollTop()
        let $elem = $('.section.' + l_page[0])
        let $elems = $('.linked.' + l_page[0])
        if ($elem.length === 0) {
            return
        }

        if (l_options.style === 'scroll') {
            var lNew = $elem.offset().top - l_menu_h
            $('body, html').animate({
                scrollTop: lNew
            }, Math.max(500, Math.abs(lCurrent - lNew) / 10))
        } else {
            $('.linked').not($elems).hide()
            $('.section').not($elem).not('.footer').hide()
            $elem.show()
            $elems.show()
        }

        if (($elem.hasClass('load') || $elem.is('[data-load]')) && !$elem.hasClass('loaded')) {
            $elem.addClass('loaded')
            $elem.html('<div class="spinner-border" role="status"></div>')
            let load = $elem.data('load') || l_page[0]
            let main_script = $elem.data('script')
            let init_function = $elem.data('init')
            H.rpc('Page', 'load', [load], async function (r) {
                $elem.empty()
                if (r) {
                    $elem.html(r)
                    if (main_script) {
                        // if (main_script.match(/mjs$/)) {
                        //     init_function = await import(main_script);
                        //     init_function.default($elem);
                        // } else {
                        await H.loadAsset(main_script)
                        evalCode(init_function, [$elem])
                        // }
                    }

                    l_fn($elem)
                    l_refresh_active()
                }
            })
        } else {
            l_fn($elem)
            l_refresh_active()
        }
    }

    /**
     * Create a form, from a server response
     *
     * @param a_param
     * @param a_options
     */
    createForm (a_param, a_options) {
        let H = this
        a_options = a_options || {}
        a_options.onupdate = a_options.onupdate || function () {}
        a_options.onstore = a_options.onstore || function () {}

        var $form = $(`
        <div id="${a_param.id}" class="card">
            <div class="card-header"></div>
            <div class="card-body tab-content"></div>
            <div class="card-footer"></div>
        </div>`)
        var l_title = a_param.title || 'Form'
        var $card_header = $form.find('.card-header').empty()
        var $card_block = $form.find('.card-body').empty()
        var $card_footer = $form.find('.card-footer').empty()
        var $title = $form.find('.card-header')
        // Tab handling
        var $card_header_tabs = $('<ul class="nav nav-tabs card-header-tabs">').appendTo($card_header)
        $card_header_tabs.on('click', function (e) {
            var $target = $(e.target)
            if ($target.is('.nav-link')) {
                $form.trigger(H.setActiveTab, [$target])
                e.preventDefault()
            }
        })
        $form.on(H.setActiveTab, function (e, $a_elem) {
            $card_header_tabs.find('.nav-link').toggleClass('active', false)
            $a_elem.toggleClass('active', true)
            $card_block.find('.tab-pane').hide()
            $card_block.find('.tab-pane' + $a_elem.attr('href')).show()
        })
        $form.on(H.onstore, a_options.onstore)
        $form.on('keydown', (e) => {
            if (e.ctrlKey && e.keyCode === 13) {
                console.log('Ctrl + Enter')
                $form.find('.btn').trigger(H.defaultAction)
            }
        })

        if (a_param.tabs && a_param.tabs.length) {
            a_param.tabs.forEach(function (tab) {
                $(`<li class="nav-item"><a class="nav-link" href="#${tab.id}">${tab.title}</a></li>`)
                    .appendTo($card_header_tabs)
            })
        } else {
            $(`<li class="nav-item"><a class="nav-link" href="#tab0" ">${l_title}</a></li>`)
                .appendTo($card_header_tabs)
        }

        if (a_param.controls && a_param.controls.length) {
            for (let i in a_param.controls) {
                if (!a_param.controls.hasOwnProperty(i)) continue
                H.createComponent($card_block, a_param.controls[i])
            }
        }

        if (a_param.buttons && a_param.buttons.length) {
            for (let i in a_param.buttons) {
                if (!a_param.buttons.hasOwnProperty(i)) continue
                H.createComponent($card_footer, a_param.buttons[i], a_param)
            }
        }

        if (a_options.container) {
            $form.appendTo(a_options.container)
        } else {
            //Botão de close
            var $button_close = $('<button type="button" class="close">&times;</button>')
                .css({
                    position: 'absolute',
                    right: '10px'
                })
            $card_header_tabs.append($button_close)

            var $win = $('<div class="modal"><div class="modal-dialog modal-lg"><div class="modal-content"></div></div></div>')
            $win.find('.modal-content').append($form)
            $win.appendTo($('body'))
            $win
                .off()
                .on('shown.bs.modal', function () {
                    var $that = $(this)
                    $button_close.off().on('click', function () {
                        $that.modal('hide')
                    })
                })
                .on('hidden.bs.modal', function () {
                    $('.modal').css({'overflow': 'auto', 'overflow-y': 'scroll'})
                    setTimeout(function () {
                        $win.remove()
                    }, 10)
                })
                .modal({
                    backdrop: 'static',
                    keyboard: false
                })
        }

        // if (a_param.type === 'grid') {
        //     var l_grid
        //     a_param.onLoad = function (event) {
        //         //
        //     }
        //     a_param.onRequest = function (event) {
        //         event.httpHeaders['X-CSRF-Token'] = g_csrf_token || ''
        //         event.httpHeaders['X-Expecting'] = 'ajax-json-grid'
        //     }
        //     a_param.onAdd = function (event) {
        //         ajax('./' + a_param.controller + '/create', {
        //             'onstore' () {
        //                 l_grid.reload()
        //             }
        //         })
        //     }
        //     a_param.onEdit = function (event) {
        //         ajax('./' + a_param.controller + '/' + event.recid + '/edit', {
        //             'onupdate' (r) {
        //                 l_grid.reload()
        //             }
        //         })
        //     }
        //     for (var i in a_param.columns) {
        //         var l_column = a_param.columns[i]
        //         if (l_column.editable && l_column.editable.type === 'select') {
        //             l_column.render = function (record, index, col_index) {
        //                 var l_val = this.getCellValue(index, col_index)
        //                 for (var ii in l_column.editable.items) {
        //                     if (l_val == l_column.editable.items[ii].id) {
        //                         return l_column.editable.items[ii].text || '-'
        //                     }
        //                 }
        //                 return '-'
        //             }
        //         }
        //     }
        //     l_grid = $('<div class="grid_container"></div>').appendTo($card_block).w2grid(a_param)
        //     //
        // }

        if (a_param.data) {
            H.unserialize($form, a_param.data)
        }

        $form.trigger(H.setActiveTab, [$card_header_tabs.find('.nav-link').first()])
    }

    /**
     * Create individual components on a form
     *
     * @param a_container
     * @param a_param
     * @param a_form_param
     */
    createComponent (a_container, a_param, a_form_param) {
        let H = this
        if (!window.g_component_id) window.g_component_id = 1
        var l_opts = a_param || {}
        var l_type = l_opts.type
        var l_subtype = l_opts.subtype || ''
        var l_id = l_opts.id || ('id' + window.g_component_id++)
        var l_name = l_opts.name
        var l_title = l_opts.title
        var l_grid_system = l_opts.grid_system || 'col'
        var l_tab_ref = l_opts.tabref || 'tab0'
        var l_container = a_container

        var l_append = function (a_element) {//Adiciona em uma celula livre ou na parte central
            var $tab = l_container.find('#' + l_tab_ref)
            if (!$tab.length) {
                $tab = $('<div class="tab-pane" id="' + l_tab_ref + '"><div class="row"></div></div>').appendTo(l_container)
            }

            $tab.find('.row').first().append(a_element)
        }

        if (l_type === 'button') {
            var $button = $(`<div class="btn">
                    <div class="h-saving"><span aria-hidden="true" class="spinner-border spinner-border-sm" role="status"></span><span class="ml-1">Salvando...</span></div>
                    <div class="h-saved text-success"><i class="la la-check-circle"></i><span class="ml-1">Salvo</span></div>
                    <div class="h-failed text-danger"><i class="la la-exclamation-circle"></i><span class="ml-1">Falhou</span></div>
                    <div class="h-def">${l_title}</div>
                    </div>`)
            $button.find('>div').not('.h-def').hide()
            if (l_subtype) {
                if (l_opts.outline) {
                    $button.addClass('btn-outline-' + l_subtype)
                } else {
                    $button.addClass('btn-' + l_subtype)
                }
            }
            if (l_opts.on) {
                var l_trigger = []
                for (let i in l_opts.on) {
                    if (!l_opts.on.hasOwnProperty(i)) continue
                    let l_method = i
                    let l_code = l_opts.on[i]
                    let l_params = []
                    if (typeof l_code !== 'string') {
                        l_code = l_opts.on[i].method
                        l_params = l_opts.on[i].params
                    }
                    $button.on(l_method, function () {
                        evalCode(l_code, l_params)
                    })
                    l_trigger.push(l_method)
                }

                if (l_opts.action === 'save') {
                    $button.on(H.defaultAction + ' click', function () {
                        let $form = a_container.closest('.card')
                        let l_data = Object.assign({}, a_form_param.data, H.serialize($form))
                        $button.find('>div').hide()
                        $button.find('.h-saving').show()
                        H.rpc(a_form_param.rpc[0], a_form_param.rpc[1], [l_data], function (r, e) {
                            setTimeout(() => {
                                $button.find('>div').hide()
                                $button.find('.h-def').show()
                            }, 2000)

                            if (r) {
                                $form.find('.form-group').trigger(H.clearValidation, [])
                                H.unserialize($form, r.data)
                                showInfo(r.message, () => {
                                    $form.trigger(H.onstore, [r.data, $form])
                                })
                                $button.find('>div').hide()
                                $button.find('.h-saved').show()
                            }

                            if (e) {
                                $button.find('>div').hide()
                                $button.find('.h-failed').show()

                                if (e.data) {
                                    $form.find('.form-group').trigger(H.setValidation, [e.data])
                                    return true
                                }
                            }
                        })
                    })
                } else if (l_opts.default) {
                    $button.addClass('isDefault').on(H.defaultAction, function () {
                        $button.trigger(l_trigger.join(' '))
                    })
                }
            }
            a_container.append($button)
            return
        }

        var $inputgroup_addon = null
        var $inputgroup_preaddon = null
        var $form_control = null
        var $form_group = null
        var $label = null

        if (l_type === 'vue' && l_subtype) {
            $form_group = $(`<div class='form-group ${l_grid_system}'></div>`)
            $form_control = $(`<div ref="c" is="${l_subtype}"></div>`)
            $label = $(`<label for='${l_id}'>${l_title}</label>`)
            $form_group.on(H.formInit, function (e, a_values) {
                const vueInstance = new Vue({
                    name: `${l_subtype}Root`,
                    methods: {
                        setProps (props) {
                            if (this.$refs.c.hasOwnProperty('setProps')) {
                                return this.$refs.c.setProps(props)
                            }
                        },
                        getValue () {
                            if (this.$refs.c.hasOwnProperty('getValue')) {
                                return this.$refs.c.getValue()
                            }
                        },
                        setValue (v) {
                            if (this.$refs.c.hasOwnProperty('setValue')) {
                                return this.$refs.c.setValue(v)
                            }
                        }
                    }
                }).$mount($form_control[0])
                vueInstance.setProps(l_opts.props)
                $form_group.on(H.setValue, function (e, a_values) {
                    if (!l_name) return
                    var $target = $(e.target)
                    var l_value = a_values[l_name]
                    if ($target.is($form_group)) {
                        vueInstance.setValue(l_value)
                    }
                })
                $form_group.on(H.getValue, (e, a_values) => {
                    if (!l_name) return
                    if (l_opts.readonly && l_name !== '_id') return
                    var $target = $(e.target)
                    if ($target.is($form_group)) {
                        a_values[l_name] = vueInstance.getValue()
                    }
                })
            })

        } else if (l_type === TYP_TEXT || l_type === TYP_NUMBER || l_type === TYP_DATETIME || l_type === TYP_TEXTAREA) {
            $form_group = $(`<div class='form-group ${l_grid_system}'></div>`)
            if (l_type === TYP_TEXTAREA) {
                $form_control = $(`<textarea class='form-control' id='${l_id}' name='${l_name}'></textarea>`)
            } else {
                $form_control = $(`<input class='form-control' type='text' id='${l_id}' name='${l_name}' />`)
            }

            $label = $(`<label for='${l_id}'>${l_title}</label>`)

            if (l_subtype === 'hidden') {
                $label.hide()
                $form_group.hide()
                $form_control.attr('type', 'hidden')
            } else if (l_subtype === ST_PASSWORD) {
                if (l_opts.empty) {
                    $form_control.attr('placeholder', '');
                } else {
                    $form_control.attr('placeholder', '(deixar em branco para manter)');
                }
                $form_control.attr('type', 'password')
                $form_control.attr('autocomplete', 'new-password')
                $inputgroup_preaddon = $('<div class="input-group-prepend"><div class="input-group-text"><i class="la la-key" aria-hidden="true"></i></div></div>')
            } else if (l_subtype === ST_EMAIL) {
                $inputgroup_preaddon = $('<div class="input-group-prepend "><div class="input-group-text"><i class="la la-envelope-o" aria-hidden="true"></i></div></div>')
            }

            if (l_opts.onchange) {
                $form_control.on('change', function () {
                    evalCode(l_opts.onchange)
                })
            }
            if (l_opts.oninput) {
                $form_control.on('input', function () {
                    evalCode(l_opts.oninput)
                })
            }

            if (l_opts.align) {
                $form_control.css('text-align', l_opts.align)
            }

            if (l_opts.maxlength) {
                $form_control.attr('maxlength', l_opts.maxlength)
            }

            if (l_opts.placeholder) {
                $form_control.attr('placeholder', l_opts.placeholder)
            }

            var l_maskinstance = null
            if (l_opts.mask) {
                const clearMaskOnLostFocus = false
                const keepStatic = true

                l_maskinstance = Inputmask(l_opts.mask, {
                    clearMaskOnLostFocus, keepStatic
                }).mask($form_control[0])
            }

            if (l_opts.initialValue) {
                $form_control.val(l_opts.initialValue)
            }

            if (l_opts.rows) {
                $form_control.attr('rows', l_opts.rows)
            }

            var l_autonumeric = null
            var l_autonumeric_options = {
                modifyValueOnWheel: false
            }
            if (l_type === TYP_NUMBER) {
                $form_control.attr('type', 'text')
                if (l_subtype === ST_INTEGER) {
                    l_autonumeric_options = $.extend({}, l_autonumeric_options, {
                        digitGroupSeparator: '',
                        decimalPlaces: 0
                    })
                }
                if (l_subtype === 'float' || l_subtype === 'currency') {
                    l_autonumeric_options = $.extend({}, l_autonumeric_options, {
                        digitGroupSeparator: g_current_locale.delimiters.thousands,
                        decimalCharacter: g_current_locale.delimiters.decimal,
                        decimalPlaces: parseInt(l_opts.decimal || 2)
                    })

                    if (l_subtype === 'currency') {
                        $inputgroup_preaddon = $(`<div class="input-group-prepend"><div class="input-group-text">${g_current_locale.currency.symbol}</div></div>`)
                    }

                    if (l_subtype === 'float') {
                        let t = l_autonumeric_options.decimalCharacter
                        for (let i = 0; i < l_autonumeric_options.decimalPlaces; i++) {
                            t += '0'
                        }
                        $inputgroup_preaddon = $(`<div class="input-group-prepend"><div class="input-group-text">${t}</div></div>`)
                    }
                }

                l_autonumeric = new AutoNumeric($form_control[0], l_autonumeric_options)
                // $form_control.attr("data-vmin", l_opts.min);
                // $form_control.attr("data-vmax", l_opts.max);
            }
            if (l_type === TYP_DATETIME) {
                $inputgroup_addon = $('<div class="input-group-append" data-toggle="datetimepicker"><div class="input-group-text"><i class="la la-calendar"></i></div></div>')
                //Pra fazer o picker funcionar
                $inputgroup_addon.data('target', '#' + l_id)
                $form_control.data('target', '#' + l_id)
                $form_control.addClass('datetimepicker-input')

                if (l_subtype === ST_DATE) {
                    $form_control.datetimepicker({
                        locale: moment.locale(),
                        format: 'L'
                    })
                } else if (l_subtype === ST_TIME) {
                    $form_control.datetimepicker({
                        locale: moment.locale(),
                        format: 'LTS'
                    })
                } else {
                    $form_control.datetimepicker({
                        locale: moment.locale(),
                        format: 'L LTS'
                    })
                }
            }

            $form_group.on(H.setValue, function (e, a_values) {
                if (!l_name) return
                var $target = $(e.target)
                if ($target.is($form_group)) {
                    var l_value = a_values[l_name]
                    if (l_autonumeric) {
                        l_autonumeric.set(l_value)
                    } else if ($form_control.is('.datetimepicker-input')) {
                        if (l_subtype === ST_DATE) {
                            l_value = l_value.replace(/\.000000Z$/, '')
                            $form_control.datetimepicker('date', window.moment(l_value).local())
                        } else {
                        $form_control.datetimepicker('date', window.moment.utc(l_value).local())
                        }
                    } else {
                        $form_control.val(l_value)
                    }
                }
            })
            $form_group.on(H.getValue, function (e, a_values) {
                if (!l_name) return
                if (l_opts.readonly && l_name !== '_id') return
                var $target = $(e.target)
                if ($target.is($form_group)) {
                    if (l_maskinstance) {
                        a_values[l_name] = l_maskinstance.unmaskedvalue()
                    } else if (l_autonumeric) {
                        a_values[l_name] = l_autonumeric.get()
                    } else if ($form_control.is('.datetimepicker-input')) {
                        a_values[l_name] = $form_control.datetimepicker('viewDate').toISOString(true)
                    } else {
                        a_values[l_name] = $form_control.val()
                    }
                }
            })

        } else if (l_type === TYP_SELECT) {
            $form_group = $(`<div class='form-group ${l_grid_system}'></div>`)
            $form_control = $(`<select class='form-control' id='${l_id}' name='${l_name}' />`)
            $label = $(`<label for='${l_id}'>${l_title}</label>`)

            if (l_opts.onchange) {
                $form_control.on('change', function () {
                    evalCode(l_opts.onchange)
                })
            }
            l_opts.multiselect = l_opts.multiselect || l_opts.multiple
            if (this.isTrue(l_opts.multiselect)) {
                $form_control.attr('multiple', true)
                $form_group.on(H.formInit, function (e, a_values) {
                    if ('selectpicker' in $form_control) {
                        $form_control.selectpicker()
                    }
                })
            }

            if (l_opts.items) {
                this.createSelectOptions($form_control, l_opts.items, l_opts.value)
            }

            $form_group.on(H.setValue, (e, a_values) => {
                if (!l_name) return
                var $target = $(e.target)
                if ($target.is($form_group)) {
                    var l_value = a_values[l_name]
                    if (l_subtype === 'boolean') {
                        if ((l_value + '').match(/1/)) {
                            $form_control.val('1 ')
                        } else if ((l_value + '').match(/0/)) {
                            $form_control.val('0 ')
                        } else {
                            $form_control.val('')
                        }
                    } else {
                        if (this.isTrue(l_opts.multiselect)) {
                            if (typeof l_value === 'string') {
                                l_value = l_value.split(';')
                            }
                            $form_control.selectpicker('val', l_value)
                        } else {
                            $form_control.val(l_value)
                        }
                    }
                }
            })
            $form_group.on(H.getValue, (e, a_values) => {
                if (!l_name) return
                if (l_opts.readonly && l_name !== '_id') return
                var $target = $(e.target)
                if ($target.is($form_group)) {
                    var l_val = $form_control.val()
                    if (this.isTrue(l_opts.multiselect)) {
                        if ($.isArray(l_val)) {
                            a_values[l_name] = l_val.join(';')
                        } else {
                            a_values[l_name] = ''
                        }
                    } else {
                        a_values[l_name] = l_val
                    }
                }
            })

        } else if (l_type === 'legend') {
            $form_group = $(`<div class='form-group ${l_grid_system}'></div>`)
            $form_control = $('<span>')
            $label = $(`<fieldset class='pl-2 border-top'><legend class="pl-2 pr-2 m-0">${l_title}</legend></fieldset>`)
        } else if (l_type === 'label') {
            $form_group = $(`<div class='form-group ${l_grid_system}'></div>`)
            $form_control = $(`<p class='lead' id='${l_id}'></p>`)
            $label = $(`<label for='${l_id}'>${l_title}</label>`)

            $form_group.on(H.setValue, function (e, a_values) {
                if (!l_name) return
                var $target = $(e.target)
                if ($target.is($form_group)) {
                    var l_value = a_values[l_name]
                    $form_control.text(l_value)
                }
            })
        } else {
            return
        }
        //Common
        if (this.isTrue(l_opts.required)) {
            $form_control.attr('required', 'required')
        }
        if (this.isTrue(l_opts.readonly)) {
            $form_control.attr('disabled', 'disabled')
        }
        if (l_opts.placeholder) {
            $form_control.attr('title', l_opts.placeholder)
        }
        if (l_opts.help) {
            $('<i class=\'la la-question-circle\'></i>')
                .appendTo($label)
                .popover({
                    content: l_opts.help,
                    trigger: 'hover'
                })
        }
        if (l_opts.on) {
            for (var i in l_opts.on) {
                let l_method = i
                let l_code = l_opts.on[i]
                $form_control.on(l_method, function () {
                    evalCode(l_code)
                })
            }
        }

        var $validation_message = $('<div></div>')
        $form_group.on(H.clearValidation, function (e, a_values) {
            if ($form_control.is('.is-invalid')) {
                $form_control.toggleClass('is-invalid is-valid', false)
                $form_control.toggleClass('is-valid', true)
            }

            if ($validation_message.is('.invalid-feedback')) {
                $validation_message.toggleClass('invalid-feedback valid-feedback', false)
                $validation_message.toggleClass('valid-feedback', true)
                $validation_message.text('')
            }
        })

        $form_group.on(H.setValidation, function (e, a_values) {
            if (!l_name) return
            var $target = $(e.target)
            var l_message = null
            if ($target.is($form_group)) {
                l_message = a_values[l_name]
            }

            $form_control.toggleClass('is-invalid is-valid', false)
            $validation_message.toggleClass('invalid-feedback valid-feedback', false)
            if (l_message) {
                $form_control.toggleClass('is-invalid', true)
                $validation_message.toggleClass('invalid-feedback', true)
                $validation_message.text(l_message)

                let $form = $form_group.closest('.card')
                $form.trigger(H.setActiveTab, [$form.find(`[href='#${l_tab_ref}'].nav-link`).first()])
            } else {
                //     $form_control.toggleClass('is-valid', true);
                //     $validation_message.toggleClass('valid-feedback', true);
                //     $validation_message.text("Ok");
                $validation_message.text('')
            }
        })

        if ($inputgroup_addon || $inputgroup_preaddon) {
            var $inputgroup = $('<div class="input-group"></div>')
            $form_group.append($label)
            $form_group.append($inputgroup)
            if ($inputgroup_preaddon) $inputgroup.append($inputgroup_preaddon)
            $inputgroup.append($form_control)
            if ($inputgroup_addon) $inputgroup.append($inputgroup_addon)
            $form_group.append($validation_message)
        } else {
            $form_group.append($label)
            $form_group.append($form_control)
            $form_group.append($validation_message)
        }
        l_append($form_group)
        $form_group.trigger(H.formInit)//Alguns componentes precisam ser inicializados depois de estar renderizado
    }

    /**
     * Populates a select component
     *
     * @param a_component
     * @param a_items
     * @param a_selected_value
     */
    createSelectOptions (a_component, a_items, a_selected_value) {
        if (typeof a_selected_value === 'undefined' || !a_selected_value) {
            a_selected_value = a_component.val()
        }
        if (typeof a_selected_value === 'undefined' || !a_selected_value) {
            a_selected_value = a_component.data('valordef') || ''//TODO Review
        }
        a_component.find('option').not('.select_text').remove()

        var lGroup = !!a_component.data('agrupar')
        var loptions = {}
        var l_data = {}
        var loptionsgroup = {}

        if (Array.isArray(a_items) && typeof a_items[0] === 'number') {
            for (let i = 0; i < a_items.length; i++) {
                loptions[a_items[i] + ''] = a_items[i] + ''
            }
        } else {
            $.each(a_items, function (i, v) {
                var ltext = ''
                var lvalue = ''
                var ltextgroup = null
                var lvaluegroup = null
                if (typeof v === 'string') {//Provavelmente chave valor. Ex: S:Sim,N:Nao
                    lvalue = i
                    ltext = v
                } else {//Multi dimensional vindo do BD
                    if (lGroup) {
                        var ii = 0
                        var lTotal = Object.keys(v).length
                        for (let key in v) {
                            if (ii === 0) {
                                lvaluegroup = v[key]
                            } else if (ii === 1) {
                                ltextgroup = v[key]
                            } else if (ii === 2) {
                                lvalue = v[key]
                            }
                            if (ii > 2) {
                                ltext = ltext + v[key]
                                if (ii < lTotal - 1) {
                                    ltext += ', '
                                }
                            }
                            ii++
                        }
                    } else {
                        var ii = 0
                        var lTotal = Object.keys(v).length
                        for (let key in v) {
                            if (ii === 0) {
                                lvalue = v[key]
                            }
                            if (ii > 0) {
                                ltext = ltext + v[key]
                                if (ii < lTotal - 1) {
                                    ltext += ', '
                                }
                            }
                            ii++
                        }
                    }
                }
                if (lvaluegroup !== null && ltextgroup !== null) {
                    if (!(lvaluegroup in loptionsgroup)) {
                        loptionsgroup[lvaluegroup] = {'dsc': ltextgroup, 'opt': {}}
                    }
                    loptionsgroup[lvaluegroup]['opt'][lvalue] = ltext

                } else {
                    loptions[lvalue] = ltext
                    l_data[lvalue] = v
                }
            })
        }
        var loptions_html = ''
        if (a_selected_value) {
            var isMultiselect = (a_component.prop('multiple'))
            //Determinando selected
            var lvalarr = (a_selected_value + '').split(/\s*[;,]+\s*/)
            if (isMultiselect) {//Mantem a ordem
                for (var i in lvalarr) {
                    if (lvalarr[i] in loptions) {
                        loptions_html += `<option value="${lvalarr[i]}" selected="selected">${loptions[lvalarr[i]].replace(/[<>]/g, '')}</option>`
                        delete loptions[lvalarr[i]]
                    }
                }
            } else {
                if (lGroup) {
                    for (let ig in loptionsgroup) {
                        loptions_html += `<optgroup label="${loptionsgroup[ig].dsc.replace(/[<>]/g, '')}">`
                        for (var i in loptionsgroup[ig].opt) {
                            loptions_html += `<option data-groupvalue="${ig}" value="${i}" ${((i + '') === (a_selected_value + '')) ? 'selected="selected"' : ''} >${loptionsgroup[ig].opt[i].replace(/[<>]/g, '')}</option>`
                            delete loptionsgroup[ig].opt[i]
                        }
                        loptions_html += '</optgroup>'
                    }
                } else {
                    for (let i in loptions) {
                        var l_option = $('<option>').data('row', l_data[i]).val(i).text(loptions[i])
                        if ((i + '') === (a_selected_value + '')) {
                            l_option.attr('selected', 'selected')
                        }
                        a_component.append(l_option)
                        delete loptions[i]
                    }
                }
            }
        }
        if (lGroup) {
            for (let ig in loptionsgroup) {
                if (!Object.keys(loptionsgroup[ig].opt).length) continue
                loptions_html += `<optgroup label="${loptionsgroup[ig].dsc}">`
                for (let i in loptionsgroup[ig].opt) {
                    loptions_html += `<option data-groupvalue="${ig}" value="${i}" >${loptionsgroup[ig].opt[i].replace(/[<>]/g, '')}</option>`
                }
                loptions_html += '</optgroup>'
            }
        } else {

            for (let i in loptions) {
                a_component.append($('<option>').data('row', l_data[i]).val(i).text(loptions[i]))
            }
        }
        if (loptions_html) {
            a_component.append(loptions_html)
        }
    }

    go (a_url) {
        document.location.href = a_url
    }

    find (a_param) {
        if (typeof a_param === 'string') {
            if (a_param.match(/^#/)) {
                a_param = $(a_param)
            } else {
                a_param = $('#' + a_param)
            }
        }
        return a_param
    }

    isValid (v) {
        switch (typeof v) {
            case 'undefined':
                return false
                break
            case 'string':
                return (v !== '' && v !== '0')
                break
            case 'number':
                return (v > 0.0)
                break
            case 'object':
                return $.isEmptyObject(v)
                break
            default:
                return true
        }
    }

    isTrue (v) {
        if (this.isValid(v)) {
            if ((v + '').match(/^(off|no|false|n|f|0)$/i)) {
                return false
            }
            return !!v
        }
        return false
    }
}

/**
 * Interpreta e executa uma função
 *
 * @param {string|function} a_function_or_code
 * @param a_params
 * @returns {undefined}
 */
export function evalCode (a_function_or_code, a_params) {
    try {
        if (typeof a_function_or_code === 'function') {
            a_function_or_code.apply(window, a_params)
            return
        }

        var l_obj = null
        var l_method = null
        if (typeof a_function_or_code === 'string') {
            var l_expr = a_function_or_code.match(/^(\w+)\.(\w+)$/)
            if (l_expr) {
                if (l_expr[1] in window) {
                    l_obj = eval(l_expr[1])
                }
                if (l_expr[2] in l_obj) {
                    l_method = l_expr[2]
                }
            }
            if (a_function_or_code in window) {
                l_obj = window
                l_method = a_function_or_code
            }
        }
        if (l_obj && l_method && l_obj[l_method]) {
            l_obj[l_method].apply(l_obj, a_params)
            return
        }

        (function () {
            eval(a_function_or_code)
        }).apply(window, a_params)
    } catch (ex) {
        console.warn('evalCode:', ex.stack)
    }
}

H.init()
H.initJQuery(jQuery)
H.initVue(Vue)

export default H
