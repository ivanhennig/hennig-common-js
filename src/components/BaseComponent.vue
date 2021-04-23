<template>
    <div />
</template>
<script>
export default {
    name: 'BaseComponent',
    data () {
        return {
            options: [],
            current: ''
        }
    },
    methods: {
        baseMounted () {
            this.initProps()
        },
        emitInput (v) {
            this.$emit('input', v)
            this.emitRow(v)
        },
        emitRow (v) {
            if (this.options.length) {
                for (const row of this.options) {
                    if (row._id === v) {
                        this.$emit('row', row)
                        return
                    }
                }
            }

            this.$emit('row', {})
        },
        initProps () {
            for (const prop in this.$props) {
                if (!prop.match(/^init_/)) continue
                this.$set(this, prop.replace(/^init_/, ''), this.$props[prop])
            }
        },
        setProps (props) {
            for (const k in props) {
                this.$set(this, k, props[k])
            }
        },
        getValue () {
            return this.current
        },
        setValue (v) {
            this.current = v
        }
    }
}
</script>
