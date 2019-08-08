let apiBase = '';
const catchError = (r) => { document.body.innerHTML = '<div style="text-align: center; color: #ff0000">× エラー</div>'; };
const getErrorMessage = response => response.data && response.data.status ? response.data.status : 'Error';

const init = () => new Vue({
  el: '#app',
  data: {
    jisentaku: null,
    kensakuKeyword: '',
    kensakuKanjis: [],
    kensakuKanji: null,
    kensakuError: null,
    kensakuchuu: false,
    kumiawaseParts: [],
    kumiawaseResults: [],
    kumiawaseError: null,
    kumiawasechuu: false
  },
  methods: {
    sentaku: function(k) {
      this.jisentaku = k;
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
    addKumiawase: function() {
      if (this.jisentaku) {
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
            this.kumiawaseResults = response.data.data;
          } else {
            this.kumiawaseError = getErrorMessage(response);
          }
        }).catch(r => {
          this.kumiawaseError = getErrorMessage(r.response);
        }).finally(() => {
          this.kumiawasechuu = false;
        });
      }
    }
  },
  watch: {
    kensakuKeyword: function() {
      this.kensakuKanjis = this.kensakuKeyword.split('');
    }
  }
});

window.onload = () => {
  axios.get('/app/main.html', {
    t: new Date().getTime()
  }).then(response => {
    document.body.innerHTML = response.data;
    const app = init();
  }).catch((r) => { catchError(r); });
};

axios.get('/api-base').then(response => {
  apiBase = response.data;
}).catch((r) => { catchError(r); });
