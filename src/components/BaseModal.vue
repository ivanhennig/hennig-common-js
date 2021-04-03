<template>
    <div class="modal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered" :class="[size]">
            <div class="modal-content">
                <div class="modal-header">
                    <slot name="header">
                        <h5 class="modal-title">
                            <i class="la la-info-circle"></i>
                            {{ title }}
                        </h5>
                    </slot>
                    <div class="close link" v-on:click="hide()">
                        <span aria-hidden="true">&times;</span>
                    </div>
                </div>
                <div class="modal-body scroll-styled">
                    <slot></slot>
                </div>
                <div class="modal-footer">
                    <slot name="footer"></slot>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import jQuery from 'jquery'

export default {
    name: 'BaseModal',
    props: {
        title: {String},
        size: {String, default: 'modal-lg'},
        backdrop: {Boolean, default: 'static'},
    },
    data () {
        return {}
    },
    methods: {
        show (callback) {
            jQuery(this.$el).modal({backdrop: this.backdrop})
            this.callback = callback
        },
        hide () {
            jQuery(this.$el).modal('hide')
            if (this.callback) this.callback(false)
        }
    }
}
</script>

<style scoped>
.modal-body {
    overflow: auto;
}
</style>
