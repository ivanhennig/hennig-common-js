<template>
  <div>
    <div class="w-100 mb-2">
      <div class="input-group">
        <select
          v-model="currentSelect"
          class="form-control custom-select"
          v-on:change="select(currentSelect)"
        >
          <option class="disabled" value="">- Selecione -</option>
          <option
            v-for="option in unselectedOptions"
            :key="option._id"
            :value="option"
            v-text="option.name"
          ></option>
        </select>
      </div>
    </div>

    <div class="list-group w-100 scroll-styled p-1 border">
      <div
        v-for="(option, index) in selectedValues"
        :key="index"
        class="list-group-item d-flex justify-content-between p-2"
      >
        <span v-text="option.name"></span>
        <div class="d-flex flex-column justify-content-center">
          <i class="la las la-times-circle" v-on:click="unselect(option, index)"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import BaseComponent from './BaseComponent'
import { valueAsArray } from '../lib/common'

export default {
  name: 'MultiSelectEditor',
  components: {},
  extends: BaseComponent,
  data () {
    return {
      currentInfo: {},
      currentSelect: ''
    }
  },
  computed: {
    selectedValues () {
      return (this.current || []).filter(el => !!el.selected)
    },
    unselectedOptions () {
      return (this.options || []).filter(el => !el.selected)
    }
  },
  methods: {
    showInfo (option, index) {
      this.currentInfo = option
      this.$nextTick(() => {
        this.$refs.info.show(() => {
          this.currentInfo = null
        })
      })
    },
    down (option, index) {
      const [el] = this.current.splice(index, 1)
      this.current.splice(Math.min(this.current.length, index + 1), 0, el)
    },
    up (option, index) {
      const [el] = this.current.splice(index, 1)
      this.current.splice(Math.max(0, index - 1), 0, el)
    },
    unselect (option, index) {
      this.$set(option, 'selected', false)
      this.current.splice(index, 1)
    },
    select (option) {
      if (!option) return
      this.$set(option, 'selected', true)
      this.current.push(option)
      this.$nextTick(() => {
        this.currentSelect = ''
      })
    },
    setProps (props) {
      if (props.options) {
        for (const option of props.options) {
          this.options.push({
            selected: false,
            ...option
          })
        }
      }
    },
    getOptionById (_id) {
      for (const option of this.options) {
        if (_id === option._id) {
          return option
        }
      }

      return null
    },
    setValue (v) {
      this.current = []
      v = valueAsArray(v)

      const values = v || []
      for (const value of values) {
        const option = this.getOptionById(value._id)
        if (!option) continue
        option.selected = true
        this.current.push(option)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.btn-link {
  cursor: pointer;
}

.sequence {
  span {
    font-size: 1.2rem;
  }

  img {
    width: 1.2rem;
    height: 1.2rem;
  }

  margin-right: .5em;
}

.la {
  font-size: 1.5em;
  cursor: pointer;
}

.list-group {
  height: 250px;
  background-color: #e9ecef;
}

.input-group-text {
  background-color: initial;
}
</style>
