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

// <div className="mr-3">
//     <button
//         type="button"
//         className="btn btn-outline-secondary dropdown-toggle activefilter"
//     >
//         <i className="la la-eye"></i>
//     </button>
//     <div className="dropdown-menu">
//         <span className="dropdown-item link activefilter10">Todos</span>
//         <span className="dropdown-item link activefilter1">Somente ativos</span>
//         <span className="dropdown-item link activefilter0">Somente cancelados</span>
//     </div>
// </div>
