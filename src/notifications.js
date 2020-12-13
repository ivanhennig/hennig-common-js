import Vue from 'vue'
import Notifications from 'vue-notification'
Vue.use(Notifications)

/**
 * @param msg
 * @param callback
 */
export function showSuccess (msg, callback = () => {}) {
    Vue.notify({
        group: 'main',
        duration: 2000,
        text: `
<div class="col-md-6 p-4 text-center" role="alert">
    <div class="check-mark"></div>
    <div class="font-weight-bold">${msg}</div>
    </div>
</div>`,
        type: 'success'
    })

    setTimeout(callback, 2000)
}

export function showInfo (text, callback = () => {}) {
    Vue.notify({
        group: 'main',
        duration: 500,
        text,
        type: 'success'
    })
    setTimeout(callback, 1000)
}

export function showError (text, callback = () => {}) {
    Vue.notify({
        group: 'main',
        duration: 2000,
        text,
        type: 'error'
    })
    setTimeout(callback, 2000)
}
