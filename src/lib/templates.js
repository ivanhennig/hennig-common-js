export function newAction (title) {
    return `<button
    class="btn btn-outline-secondary toolbar-action def mr-1"
    title="${title}"
    type="button"
>
    <i class="la la-plus"></i>
</button>`
}

export function activeFilter () {
    return `<div class="dropdown d-inline-block mr-1">
    <div aria-expanded="false" aria-haspopup="true" class="btn btn-outline-secondary dropdown-toggle" data-toggle="dropdown" id="dropdownMenuButton" type="button">
        <i class="la la-eye"></i>
    </div>
    <div aria-labelledby="dropdownMenuButton" class="dropdown-menu">
        <span class="dropdown-item link toolbar-action activefilterAll">Todos</span>
        <span class="dropdown-item link toolbar-action activefilter1">Somente ativos</span>
        <span class="dropdown-item link toolbar-action activefilter0">Somente cancelados</span>
    </div>
</div>`
}

export function printButton () {
    return `<button
    class="btn btn-outline-secondary toolbar-action print-action mr-1"
    title="Imprimir"
    type="button"
>
    <i class="la la-print"></i>
</button>`
}

export function exportButton () {
    return `<button
    class="btn btn-outline-secondary toolbar-action export-action mr-1"
    title="Exportar"
    type="button"
>
    <i class="la la-file-excel-o"></i>
</button>`
}
