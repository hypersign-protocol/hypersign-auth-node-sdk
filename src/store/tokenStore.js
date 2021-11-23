module.exports = class TokenStore {
  constructor() {
    this.store = new Map();
  }

  // seconds to date
  toDateTime(secs) {
    const t = new Date(); // Epoch
    t.setSeconds(t.getSeconds() + secs);
    return t;
  }

  // the reason I had to use this becuase When delay is larger than 2147483647 the delay will be set to 1 since
  // setTimeout using a 32 bit INT to store the delay so the max value allowed would be 2147483647
  // Ref: https://stackoverflow.com/questions/3468607/why-does-settimeout-break-for-large-millisecond-delay-values
  triggerDelete(date, func) {
    const now = new Date().getTime();
    const then = date.getTime();
    const diff = Math.max(then - now, 0);
    if (diff > 0x7fffffff) {
      //setTimeout limit is MAX_INT32=(2^31-1)
      setTimeout(function () {
        this.triggerDelete(date, func);
      }, 0x7fffffff);
    } else {
      setTimeout(func, diff);
    }
  }

  // by default ref token never expires in 30s
  set(key, value, expiryTime = 30) {
    this.triggerDelete(this.toDateTime(expiryTime), () => {      
      this.delete(key);
    });
    return this.store.set(key, value);
  }

  get(key) {
    return this.store.get(key);
  }
  has(key) {
    return this.store.has(key);
  }
  delete(key) {
    return this.store.delete(key);
  }
};
