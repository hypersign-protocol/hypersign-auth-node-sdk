module.exports = class TokenStore {
  constructor() {
    this.store = new Map();
  }
  // by default ref token never expires in 30s
  set(key, value, expiryTime = 30) {
    setTimeout(() => {
      console.log("Refresh token expired in " + expiryTime + " seconds")
      this.delete(key)
    }, expiryTime * 1000)
    return this.store.set(key, value);
  }

  get(key) {
    return this.store.get(key);
  }
  has(key) {
    return this.store.has(key);
  }
  delete(key){
    return this.store.delete(key)
  }
};
