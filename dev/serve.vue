<script>
import Vue from 'vue';

// Uncomment import and local "components" registration if library is not registered globally.
import { BaseModal } from '@/entry.esm';

export default Vue.extend({
  name: 'ServeDev',
    components: {BaseModal},
});
</script>

<template>
  <div id="app">
    <BaseModal />
  </div>
</template>
