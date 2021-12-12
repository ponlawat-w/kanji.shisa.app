let apiBase = '';
const numKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const numKeyToIndex = val => {
  const idx = (val - 1) % 10;
  return idx < 0 ? idx + 10 : idx;
};
const catchError = () => { document.body.innerHTML = '<div style="text-align: center; color: #ff0000">× エラー</div>'; };
const getErrorMessage = response => response.data && response.data.status ? response.data.status : 'Error';
const prevent = (e) => { e.stopPropagation(); e.stopImmediatePropagation(); e.preventDefault(); };
const chunkArray = (arr, size = 10) => {
  const results = [];
  while (arr.length) {
    results.push(arr.splice(0, size));
  }
  return results;
};

const initKanjisList = templateHtml => {
  Vue.component('kanjis-list', {
    template: templateHtml,
    props: [
      'list',
      'starttabindex',
      'mainid'
    ],
    data: function() {
      return {
        focused: null,
        numKeys: numKeys
      };
    },
    methods: {
      lineKey: function(e) {
        if (this.focused === null) {
          return;
        }
        const val = parseInt(e.key);
        if (!isNaN(val)) {
          const idx = numKeyToIndex(val);
          if (this.list && this.list[this.focused] && this.list[this.focused][idx]) {
            this.$emit('setsentaku', this.list[this.focused][idx]);
          }
          return;
        }

        switch (e.key) {
          case 'ArrowDown':
            this.focused++; break;
          case 'ArrowUp':
            this.focused--; break;
          case 'Home':
            this.focused = 0; break;
          case 'End':
            this.focused = this.list.length; break;
          default:
            return;
        }
        prevent(e);
        if (this.focused < 0) {
          this.focused = 0;
        }
        if (this.focused >= this.list.length - 1) {
           this.focused = this.list.length - 1;
        }
        this.$emit('setfocus', `${this.mainid}${this.focused}`);
      },
      sentaku: function(k) {
        this.$emit('setsentaku', k);
      }
    }
  });
};

const initMain = () => new Vue({
  el: '#app',
  data: {
    focusList: [],
    numKeys: numKeys,
    jisentaku: null,
    jisentakuFocused: false,
    kensakuKeyword: '',
    kensakuKanjis: [],
    kensakuFocused: false,
    kensakuKanji: null,
    kensakuError: null,
    kensakuchuu: false,
    kensakuResultFocused: false,
    kumiawaseParts: [],
    kumiawaseResults: [],
    kumiawaseError: null,
    kumiawasechuu: false,
    kumiawaseFocused: false
  },
  methods: {
    focusId: function(id) {
      const el = document.getElementById(id);
      if (el) {
        el.focus();
        return true;
      }
      return false;
    },
    focus: function(id) {
      if (!this.focusId(id) && this.focusList.indexOf(id) === -1) {
        this.focusList.push(id);
      }
    },
    sentaku: function(k) {
      this.jisentaku = k;
      this.focus('jisentaku');
    },
    jisentakuKey: function(e) {
      switch (e.key) {
        case 'a':
          this.addKumiawase(); this.focus('kensakuKeyword'); break;
        case 's':
          this.kensakuAction(); this.focus('kensakuKeyword'); break;
        case 'c':
          this.copyToClipboard(); this.focus('kensakuKeyword'); break;
        case 'j':
          if (e.altKey) { window.open(this.jishoUrl); } else { window.location = this.jishoUrl; } break;
        case 'Escape':
          this.sentaku(null); this.focus('kensakuKanjis'); break;
      }
    },
    kensakuKey: function(e) {
      if (e.target.id === 'kensakuKeyword') {
        return;
      }
      const val = parseInt(e.key);
      if (!isNaN(val)) {
        const idx = numKeyToIndex(val);
        if (idx < this.kensakuKanjis.length) {
          this.sentaku(this.kensakuKanjis[idx]);
        }
      }
    },
    kensakuAction: function() {
      if (this.jisentaku) {
        const k = this.jisentaku;
        this.jisentaku = null;
        this.kensakuchuu = true;
        this.kensakuError = '';
        this.kensakuKanji = null;
        this.kensakuKeyword = k;
        axios.get(`${apiBase}/api/v1/kanji/search/${k}`).then(response => {
          if (response.data.ok) {
            this.kensakuKanji = response.data.data;
          } else {
            this.kensakuError = getErrorMessage(response);
          }
        }).catch(r => {
          this.kensakuError = getErrorMessage(r.response);
        }).finally(() => {
          this.kensakuchuu = false;
        });
      }
    },
    copyToClipboard: function() {
      if (!navigator.clipboard) {
        alert('ไม่สามารถคัดลอกได้');
        this.kensakuKeyword = this.jisentaku;
        this.jisentaku = null;
        return;
      }
      navigator.clipboard.writeText(this.jisentaku).then(function() {
        this.jisentaku = null;
      }.bind(this));
    },
    addKumiawase: function() {
      if (this.jisentaku && this.kumiawaseAddable) {
        this.kumiawaseParts.push(this.jisentaku);
        this.jisentaku = null;
      }
    },
    deleteKumiawase: function(idx) {
      this.kumiawaseParts.splice(idx, 1);
    },
    clearKumiawase: function() {
      this.kumiawaseParts = [];
    },
    actionKumiawase: function() {
      if (this.kumiawaseParts.length) {
        this.kumiawasechuu = true;
        this.kumiawaseResults = [];
        this.kumiawaseError = null;
        axios.get(`${apiBase}/api/v1/kanji/kumiawase/${this.kumiawaseParts.join('')}`).then(response => {
          if (response.data.ok) {
            this.kumiawaseResults = chunkArray(response.data.data);
          } else {
            this.kumiawaseError = getErrorMessage(response);
          }
        }).catch(r => {
          this.kumiawaseError = getErrorMessage(r.response);
        }).finally(() => {
          this.kumiawasechuu = false;
        });
      }
    },
    kumiawaseKey: function(e) {
      switch (e.key) {
        case 'c':
          this.clearKumiawase();
          break;
        case 's':
          this.actionKumiawase();
          break;
        case 'l':
          this.focus('kumiawaseResults0');
          break;
      }
    },
    kensakuResultKey: function(e) {
      if (!this.kensakuKanji) {
        return;
      }

      switch (e.key) {
        case 'k':
          this.sentaku(this.kensakuKanji.kanji); break;
        case 'b':
          this.focus('minorParts0'); break;
        case 'p':
          this.focus('majorParts0'); break;
      }
    },
    keyupdown: function(e) {
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            if (e.type === 'keyup') {
              this.sentaku(null);
              this.focus('kensaku');
            }
            break;
          case 'k':
            if (e.type === 'keyup') {
              this.sentaku(null);
              this.focus('kumiawase');
            }
            break;
          default:
            return;
        }
      } else if (e.ctrlKey) {
        switch (e.key) {
          case 'i':
            if (e.type === 'keyup') {
              this.focus('kensakuResults');
            }
            break;
          default:
            return;
        }
      } else {
        return;
      }
      if (e.type === 'keydown') {
        prevent(e);
      }
    }
  },
  watch: {
    kensakuKeyword: function() {
      this.kensakuKanjis = this.kensakuKeyword.split('');
    },
    kumiawaseParts: function() {
      this.kumiawaseResults = [];
    }
  },
  computed: {
    kumiawaseAddable: function() {
      return this.kumiawaseParts.indexOf(this.jisentaku) === -1;
    },
    minorParts: function() {
      return this.kensakuKanji.minorParts ?
        chunkArray(this.kensakuKanji.minorParts) : [];
    },
    majorParts: function() {
      return this.kensakuKanji.majorParts ?
        chunkArray(this.kensakuKanji.majorParts) : [];
    },
    jishoUrl: function() {
      return `https://jisho.org/search/${this.jisentaku}%20%23kanji`;
    }
  },
  mounted: function() {
    this.focus('kensakuKeyword');
    document.addEventListener('keyup', this.keyupdown);
    document.addEventListener('keydown', this.keyupdown);
  },
  updated: function() {
    for (let i = 0; i < this.focusList.length; i++) {
      if (this.focusId(this.focusList[i])) {
        this.focusList.splice(i--, 1);
      }
    }
  }
});

window.onload = () => {
  let kanjisListTemplate = null;

  const loadMainTemplatePromise = axios.get('/app/main.html', {
    t: new Date().getTime()
  }).then(response => {
    document.body.innerHTML = response.data;
  }).catch(r => catchError(r));

  const loadKanjisListTemplatePromise = axios.get('/app/kanjis-list.html', {
    t: new Date().getTime()
  }).then(response => {
    kanjisListTemplate = response.data;
  }).catch(r => catchError(r));
  
  const loadApiBasePromise = axios.get('/api-base').then(response => {
    apiBase = response.data;
  }).catch((r) => { catchError(r); });

  Promise.all([loadMainTemplatePromise, loadKanjisListTemplatePromise, loadApiBasePromise]).then(() => {
    initKanjisList(kanjisListTemplate);
    initMain();
  });
};

