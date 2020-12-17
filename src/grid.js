import H, {evalCode} from './H'
import bootgrid from './jquery.bootgrid'
import {activeFilter, newAction} from './templates'
import {showError} from './notifications'

export function initGrid (options = {}) {
    bootgrid()
    options.container = options.container || $('[data-toggle="bootgrid"]')

    const collectionObj = options.collectionObj
    const bootgridParams = options.bootgridParams || {}
    options.formatters = options.formatters || {}
    const customMethods = options.customMethods || {}
    const defaultSearch = {}

    options.container
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

            $actionBar.prepend($(activeFilter()))
            if (!options.noAddButton) {
                $actionBar.prepend($(newAction(options.addLabel || 'Novo item')))
            }
        })
        .on('loaded.rs.jquery.bootgrid', function () {
            if (options.customEdit) {
                customMethods.customEdit = options.customEdit
            }

            if (options.modalEdit) {
                customMethods.modalEdit = true
            }

            handleEvents(this, collectionObj, customMethods)
        })
        .bootgrid({
            ajax: true,
            url: `rpc/${collectionObj}/records`,
            requestHandler (request, elem) {
                const customSearch = options.search || $(elem).closest('div').find('.search-container').find('input, select').serializeObject()
                request.search = { ...defaultSearch, ...customSearch }
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
                'dt' (column, row) {
                    if (!row[column.id]) {
                        return '-';
                    }

                    return moment(row[column.id]).format('L LTS')
                },
                'udt' (column, row) {
                    if (!row[column.id]) {
                        return '-';
                    }

                    return moment.utc(row[column.id]).local().format('L LTS')
                },
                ...options.formatters,
                ...bootgridParams.formatters
            },
        })
}

export function handleEvents (grid, classname, custom = {}) {
    let $grid = $(grid)
    $grid.find('tbody tr').off().on('click', function (element) {
        let $that = $(element.target)
        if (!$that.is('.command')) return

        const _id = $that.data('row-id')

        if ($that.is('.edit')) {
            H.rpc(classname, 'form', [_id], function (r, e) {
                if (!r) return

                if (custom.modalEdit) {
                    H.createForm(r, {
                        onstore (evnt, data, $form) {
                            $grid.bootgrid('reload')
                            $form.closest('.modal').modal('hide')
                        }
                    })
                } else if (custom.customEdit) {
                    custom.customEdit.apply(window, [classname, $grid, _id])
                } else {
                    redirect({name: classname, params: {_id}})
                }

            })
        } else if ($that.is('.delete')) {
            H.showQuery('Deseja deletar este registro?', function (a) {
                if (!a) return
                H.rpc(classname, 'delete', [_id], function (r, e) {
                    if (r) {
                        $grid.bootgrid('reload')
                    }
                })
            })
        } else if ($that.is('.checkbox')) {
            let p = {_id}
            p[$that.data('field')] = !$that.data('value')
            H.rpc(classname, 'save', [p], function (r, e) {
                if (r) {
                    $grid.bootgrid('reload')
                }
            })
        } else {
            for (const name in custom) {
                if ($that.hasClass(name)) {
                    custom[name].apply(window, [_id, $that, $grid])
                }
            }
        }
    })
}
