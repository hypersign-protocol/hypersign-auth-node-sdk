// const did_store=new  Map()

// module.exports={
// did_store,

// }

module.exports = class Did_store {
  constructor() {
    this.store = new Map();
  }
  set(key, value) {
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
