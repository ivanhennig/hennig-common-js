import H, {evalCode} from './H'
import bootgrid from './jquery.bootgrid'
import {activeFilter, newAction} from './templates'
import {showError} from './notifications'

/**
 * options
 * - **container** jQuery element to render in
 * - **collectionObj** Class name to call
 * - **addLabel** String to use as button add text
 * - **customAdd** Function to call instead of builtin
 * - **noAddButton** Disables
 * - **noActiveFilter** Disables
 * - **rowClick** Use row click as edit link
 *
 * @param {Object} options
 * @return {$}
 */
export function initGrid (options = {}) {
    bootgrid()
    options.container = options.container || $('[data-toggle="bootgrid"]')

    const collectionObj = options.collectionObj
    const rowClick = !!options.rowClick
    const bootgridParams = options.bootgridParams || {}
    options.formatters = options.formatters || {}
    const customMethods = options.customMethods || {}
    const defaultSearch = {}

    return options.container
        .on('initialized.rs.jquery.bootgrid', function () {
            const $grid = $(this)
            let $actionBar = $grid.prev().find('.actionBar')
            $actionBar.on('click', function (evnt) {
                const $target = $(evnt.target).closest('.toolbar-action')

                if ($target.is('.def')) {
                    if (options.modalAdd) {
                        H.rpc(collectionObj, 'form', [''], (r) => {
                            if (!r) return
                            H.createForm(r, {
                                onstore (evnt, data, $form) {
                                    $grid.bootgrid('reload')
                                    $form.closest('.modal').modal('hide')
                                }
                            })
                        })
                    } else if (options.customAdd) {
                        options.customAdd.apply(window, [collectionObj, $grid])
                    } else {
                        redirect({name: collectionObj})
                    }
                } else if ($target.is('.activefilter1')) {
                    defaultSearch.active = 1
                    $grid.bootgrid('reload')
                } else if ($target.is('.activefilter0')) {
                    defaultSearch.active = 0
                    $grid.bootgrid('reload')
                } else if ($target.is('.activefilterAll')) {
                    defaultSearch.active = undefined
                    $grid.bootgrid('reload')
                }
            })

            if (!options.noActiveFilter) {
                $actionBar.prepend($(activeFilter()))
            }

            if (!options.noAddButton) {
                $actionBar.prepend($(newAction(options.addLabel || 'Novo item')))
            }
        })
        .on('loaded.rs.jquery.bootgrid', function (evnt) {
            if (options.customEdit) {
                customMethods.customEdit = options.customEdit
            }

            if (options.modalEdit) {
                customMethods.modalEdit = true
            }

            handleEvents(evnt, this, collectionObj, customMethods, rowClick)
        })
        .bootgrid({
            ajax: true,
            url: `rpc/${collectionObj}/records`,
            requestHandler (request, elem) {
                let customSearch = {}
                if (options.search) {
                    customSearch = options.search
                    if (typeof customSearch === 'function') {
                        customSearch = customSearch()
                    }
                } else {
                    customSearch = $(elem).closest('div').find('.search-container').find('input, select').serializeObject()
                }

                request.search = {...defaultSearch, ...customSearch}
                return request
            },
            responseHandler (response) {
                if (Array.isArray(response)) {
                    for (const el of response) {
                        if ('method' in el) {//Servidor enviando comandos
                            evalCode(el.method, el.params)
                            continue
                        }

                        response = el
                        break
                    }
                }

                if (response && response.result) {
                    return response.result
                }

                if (response.error) {
                    showError(response.error.message)
                    return {current: 1, rows: [], rowCount: 0, total: 0}
                }
            },
            rowCount: [50, 200, 500],
            labels: {
                all: 'Todos',
                infos: 'Mostrando {{ctx.start}} a {{ctx.end}} de {{ctx.total}} registros.',
                loading: 'Carregando...',
                noResults: 'Nenhum registro encontrado',
                refresh: 'Atualizar',
                search: 'Pesquisar'
            },
            formatters: {
                'checkbox' (column, row) {
                    return row[column.id] == 1 ?
                        `<i class="command checkbox la la-check-circle link" title="${column.text}" data-row-id="${row._id}" data-field="${column.id}" data-value="${row[column.id]}"></i>` :
                        `<i class="command checkbox la la-circle link" title="${column.text}" data-row-id="${row._id}" data-field="${column.id}" data-value="${row[column.id]}"></i>`
                },
                'upload' (column, row) {
                    if (!row[column.id]) {
                        return `<i class="command upload la la-upload" data-row-id="${row._id}" data-value="${row[column.id]}"></i>`
                    }

                    return `<i class="command upload la la-image" data-row-id="${row._id}" data-value="${row[column.id]}"></i>`
                },
                'x' (column, row) {
                    return `<i class="command delete la la-trash" data-row-id="${row._id}"></i>`
                },
                'v' (column, row) {
                    return `<i class="command view la la-file" data-row-id="${row._id}"></i>`
                },
                'e' (column, row) {
                    return `<i class="command edit la la-pencil" data-row-id="${row._id}"></i>`
                },
                'd' (column, row) {
                    if (!row[column.id]) {
                        return '-'
                    }

                    return moment(row[column.id]).format('L')
                },
                'dt' (column, row) {
                    if (!row[column.id]) {
                        return '-'
                    }

                    return moment(row[column.id]).format('L LTS')
                },
                'udt' (column, row) {
                    if (!row[column.id]) {
                        return '-'
                    }

                    return moment.utc(row[column.id]).local().format('L LTS')
                },
                ...options.formatters,
                ...bootgridParams.formatters
            },
        })
}

function _edit (evnt, _id, grid, classname, custom) {
    let $grid = $(grid)
    if (custom.modalEdit) {
        H.rpc(classname, 'form', [_id], function (r, e) {
            if (!r) return
            H.createForm(r, {
                onstore (evnt, data, $form) {
                    $grid.bootgrid('reload')
                    $form.closest('.modal').modal('hide')
                }
            })
        })
    } else if (custom.customEdit) {
        custom.customEdit.apply(window, [classname, $grid, _id])
    } else {
        redirect({name: classname, params: {_id}}, evnt.ctrlKey || evnt.shiftKey)
    }
}

export function handleEvents (evnt, grid, classname, custom = {}, rowClick) {
    let $grid = $(grid)
    const $tr = $grid.find('tbody tr')
    let longPress = 0
    $tr.off('mousedown').on('mousedown', function () {
        longPress = performance.now()
    });
    $tr.off('click').on('click', function (evnt) {
        if (performance.now() - longPress > 250) {
            return
        }

        let $that = $(evnt.target)


        let handled
        if ($that.is('.command')) {
            const _id = $that.data('row-id')
            if ($that.is('.edit')) {
                handled = true
                _edit(evnt, _id, grid, classname, custom)
            } else if ($that.is('.delete')) {
                H.showQuery('Deseja deletar este registro?', function (a) {
                    if (!a) return
                    H.rpc(classname, 'delete', [_id], function (r, e) {
                        if (r) {
                            $grid.bootgrid('reload')
                        }
                    })
                })
                handled = true
            } else if ($that.is('.checkbox')) {
                let p = {_id}
                p[$that.data('field')] = !$that.data('value')
                H.rpc(classname, 'save', [p], function (r, e) {
                    if (r) {
                        $grid.bootgrid('reload')
                    }
                })
                handled = true
            } else {
                for (const name in custom) {
                    if ($that.hasClass(name)) {
                        custom[name].apply(window, [_id, $that, $grid])
                        handled = true
                    }
                }
            }
        }

        if (!handled && rowClick) {
            const rowid = $that.closest('[data-row-id]').data('row-id')
            const rows = $grid.bootgrid('getCurrentRows')
            _edit(evnt, rows[rowid]._id, grid, classname, custom)
        }
    })
}