import H, { evalCode } from './H'
import $ from 'jquery'
import bootgrid from './jquery.bootgrid'
import { activeFilter, newAction, printButton, exportButton } from './templates'
import { showError } from './notifications'

/**
 * # Grid
 *
 * ## Options
 * - **container** jQuery element to render in
 * - **collectionObj** Class name to call
 * - **search** Search obj to use as filter
 * - **rowClick** Use row click as edit link
 * - **prefix** Used as base of RPC call
 *
 * ## Callback
 * - ** confirmationMethod ** Will be fired before delete a row
 *
 * ## Form default is to call a redirect method
 * - **modalAdd** Use modal for adding
 * - **modalEdit** Use modal for adding
 * - **customAdd** Function to call
 * - **customEdit** Function to call
 *
 * ## Buttons
 * - **addLabel** String to use as button add text
 * - **noAddButton** Disables
 * - **noActiveFilter** Disables
 * - **noPrint** Disables
 * - **useExport** Enable exporting feature
 *
 * ## Custom fields
 * - **actions** Replace props below
 * - **formatters** Object of functions, must return HTML
 * - **customMethods** Object of functions, work together to **formatters**
 *
 * ## Bootgrid
 * - **bootgridParams.rowCss(row)**
 * - **bootgridParams.navigation**: 0 = none, 1 = show only header, 2 = show only footer, 3 = both
 *
 * @param {Object} options
 * @return {$}
 */
export function initGrid (options = {}) {
  if (!$.bootgrid) bootgrid()

  options = $.extend(true, { ...window.HDefaults }, options)
  options.container = options.container || $('[data-toggle="bootgrid"]')

  if (!options.confirmationMethod) {
    console.error('Please set a "confirmationMethod"')
  }

  const collectionObj = options.collectionObj
  const rowClick = !!options.rowClick
  let bootgridParams = window.HDefaults.bootgridParams()
  if (options.bootgridParams) {
    bootgridParams = { ...options.bootgridParams() }
  }
  options.formatters = options.formatters || {}
  options.customMethods = options.customMethods || {}
  const defaultSearch = {}

  options.actions = options.actions || []
  for (const action of options.actions) {
    options.formatters[action.name] = (column, row) => {
      return `<i class="command ${action.name} la ${action.icon}" title="${action.title || ''}" data-row-id="${row._id}"></i>`
    }
    options.customMethods[action.name] = action.handler
  }
  const headers = (window.HDefaults && window.HDefaults.headers && window.HDefaults.headers()) || {}

  let prefix = options.prefix
  if (typeof prefix === 'function') {
    prefix = prefix()
  }

  return options.container
    .on('initialized.rs.jquery.bootgrid', function () {
      const $grid = $(this)
      const $actionBar = $grid.prev().find('.actionBar')
      $actionBar.on('click', function (evnt) {
        const $target = $(evnt.target).closest('.toolbar-action')
        const activeFieldName = options.activeFieldName || 'active'
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
            redirect({ name: collectionObj })
          }
        } else if ($target.is('.print-action')) {
          window.print()
        } else if ($target.is('.export-action')) {
          const search = _searchObj(defaultSearch, options, $grid)
          const searchPhrase = $grid.prev().find('.search-field').val() || ''
          H.rpc(collectionObj, 'export', [{ searchPhrase, search }], link => {
            if (!link) return
            window.open(link)
          })
        } else if ($target.is('.activefilter1')) {
          defaultSearch[activeFieldName] = 1
          $grid.bootgrid('reload')
        } else if ($target.is('.activefilter0')) {
          defaultSearch[activeFieldName] = 0
          $grid.bootgrid('reload')
        } else if ($target.is('.activefilterAll')) {
          delete defaultSearch[activeFieldName]
          $grid.bootgrid('reload')
        }
      })

      if (!options.noActiveFilter) {
        $actionBar.prepend($(activeFilter()))
      }

      if (!options.noPrint) {
        $actionBar.prepend($(printButton()))
      }

      if (options.useExport) {
        $actionBar.prepend($(exportButton()))
      }

      if (!options.noAddButton) {
        $actionBar.prepend($(newAction(options.addLabel || 'Novo item')))
      }
    })
    .on('loaded.rs.jquery.bootgrid', function (evnt) {
      if (options.customEdit) {
        options.customMethods.customEdit = options.customEdit
      }

      if (options.modalEdit) {
        options.customMethods.modalEdit = true
      }

      jQuery(this)
        .find('.command.edit').popover({ content: 'Editar este registro', trigger: 'hover' }).end()
        .find('.command.delete').popover({ content: 'Deletar este registro', trigger: 'hover' }).end()
        .find('.command.checkbox').popover({ content: 'Mudar o status', trigger: 'hover' }).end()

      jQuery(this).find('.command[title]').each((i, el) => {
        const title = $(el).attr('title')
        $(el).removeAttr('title')
        if (title) {
          $(el).popover({ content: title, trigger: 'hover' })
        }
      })

      handleEvents(evnt, this, options)
    })
    .bootgrid({
      ...bootgridParams,
      ajaxSettings: {
        headers
      },
      ajax: true,
      url: `${prefix}rpc/${collectionObj}/records`,
      requestHandler (request, elem) {
        request.search = _searchObj(defaultSearch, options, elem)
        return request
      },
      responseHandler (response) {
        if (Array.isArray(response)) {
          for (const el of response) {
            if ('method' in el) { // Servidor enviando comandos
              evalCode(el.method, el.params)
              continue
            }

            response = el
            break
          }
        }

        const beforeCallback = (window.HDefaults && window.HDefaults.beforeCallback) || ''

        if (response && response.result) {
          if (beforeCallback) {
            // If handled stop
            if (beforeCallback(response.result, null) === true) {
              return
            }
          }
          return response.result
        }

        if (response.error) {
          if (beforeCallback) {
            // If handled stop
            if (beforeCallback(null, response.error) === true) {
              return
            }
          }

          showError(response.error.message)
          return { current: 1, rows: [], rowCount: 0, total: 0 }
        }
      },
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
          return row[column.id] == 1
            ? `<i class="command checkbox la la-check-circle link" data-row-id="${row._id}" data-field="${column.id}" data-value="${row[column.id]}"></i>`
            : `<i class="command checkbox la la-circle link" data-row-id="${row._id}" data-field="${column.id}" data-value="${row[column.id]}"></i>`
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
      }
    })
}

function _searchObj (defaultSearch, options, elem) {
  let customSearch = {}
  if (options.search) {
    customSearch = options.search
    if (typeof customSearch === 'function') {
      customSearch = customSearch()
    }
  } else if (elem) {
    customSearch = $(elem).closest('div').find('.search-container').find('input, select').serializeObject()
  }

  return { ...defaultSearch, ...customSearch }
}

function _edit (evnt, _id, grid, classname, custom) {
  const $grid = $(grid)
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
    redirect({ name: classname, params: { _id } }, evnt.ctrlKey || evnt.shiftKey)
  }
}

export function handleEvents (evnt, grid, options = {}) {
  const { collectionObj, customMethods, rowClick, confirmationMethod } = options
  const $grid = $(grid)
  const $tr = $grid.find('tbody tr')
  let longPress = 0
  $tr.off('mousedown').on('mousedown', function () {
    longPress = performance.now()
  })
  $tr.off('click').on('click', function (evnt) {
    if (performance.now() - longPress > 250) {
      return
    }

    const $that = $(evnt.target)
    let handled
    if ($that.is('.command')) {
      const _id = $that.data('row-id')
      if ($that.is('.edit')) {
        handled = true
        _edit(evnt, _id, grid, collectionObj, customMethods)
      } else if ($that.is('.delete')) {
        confirmationMethod(function (a) {
          if (!a) return
          H.rpc(collectionObj, 'delete', [_id], function (r, e) {
            if (r) {
              $grid.bootgrid('reload')
            }
          })
        })
        handled = true
      } else if ($that.is('.checkbox')) {
        const p = { _id }
        p[$that.data('field')] = !$that.data('value')
        H.rpc(collectionObj, 'save', [p], function (r, e) {
          if (r) {
            $grid.bootgrid('reload')
          }
        })
        handled = true
      } else {
        for (const name in customMethods) {
          if ($that.hasClass(name)) {
            customMethods[name].apply(window, [_id, $that, $grid, () => {
              const rows = $grid.bootgrid('getCurrentRows')
              return rows.first(function (item) {
                return item['_id'] === _id
              })
            }])
            handled = true
          }
        }
      }

      if ($that.closest('td').find(':first').is('.prevent-row-click')) {
        handled = true
      }
    }

    if (!handled && rowClick) {
      const rowid = $that.closest('[data-row-id]').data('row-id')
      const rows = $grid.bootgrid('getCurrentRows')
      const current_row_data = rows.first(function (item) {
        return item['_id'] === rowid
      })
      if (typeof rowClick === 'function') {
        rowClick(current_row_data)
      } else {
        _edit(evnt, current_row_data._id, grid, collectionObj, customMethods)
      }
    }
  })
}
