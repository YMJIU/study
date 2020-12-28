(function(global, undefined) {
  // 全局暴露的对象
  const mySea = global.mySea = {}
  // 所有模块
  const cached = mySea.cached = {}

  const STATUS = {
    FETCHING: 1,
    SAVED: 2,
    LOADING: 3,
    LOADED: 4
  }
  
  // 用于计算use调用的次数
  let useId = 0
  function cid() {
    return useId++
  }

  /**
   * 获取根目录
   * @param {*} url 传入的url地址 
   */
  function dirname(url) {
    return url.match(/[^?#]*\//)[0]
  }
  // 根目录
  const loac = dirname(location.href)
  // 构建阶段参数
  // 构建完成
  const created = {}
  // 正在构建
  const createing = {}
  // 包存对象 用于进行load
  const callBacks = {}
  
  function createUrl(dep) {
    // /./ ====> /  
    // /../ ====> /  
    dep = (loac + dep).replace(/\/\.+\//, '/')
    // 构造路径
    return dep
  }

  function requestScript () {

  }

  class Module{
    constructor(url, deps) {
      // 模块路径
      this.url = url
      // 依赖数组
      this.deps = deps || []
      // 依赖构建后的对象
      this.depsObj = {} 
      // 状态
      this.status = 0
      this._entry = []
    }
    load() {
      // 已经在加载中 或者加载完了
      if (mod.status >= STATUS.LOADING) {
        return
      }

      this.status = STATUS.LOADING
      // 模块加载方法
      const { deps, depsObj, _entry } = this
      // 循环依赖 构建依赖得 Module对象
      const urls = this.depUrls()
      urls.forEach((item, index) => {
        depsObj[deps[index]] = Module.getDeps(item)
      })
      this.pushParent()
      // _entry存在值就有可能需要触发回调
      if (_entry.length > 0) {
        this.onload()
        return
      }

      const requestCache = {}

      deps.forEach(item => {
        // 当前依赖还未进行构建
        if (depsObj[item].status < STATUS.FETCHING) {
          depsObj[item].createScript(requestCache)
        }
      })
    }
    onload() {
      const { _entry } = this
      _entry.forEach(item => {
        if (--_entry.remain === 0) {
          _entry.callBack()
        }
      })
    }
    createScript(requestCache) {
      // 构建状态
      this.status = STATUS.FETCHING

      const { url } = this
      // 已经构建完成 可以直接load
      if (created.hasOwnProperty(url)) {
        this.load()
        return
      }

      // 正在构建当中
      if (createing.hasOwnProperty(url)) {
        callBacks[url].push(this)
        return
      }

      createing[url] = true
      callBacks[url] = [this]

      const _data = {
        requestUri: url,
        onRequest: onRequest
      }

      requestCache[url] = sendRequest

      // 构建方法
      function sendRequest() {
        requestScript()
      }
      // 构建成功方法
      function onRequest() {

      }
    }
    depUrls() {
      const { deps } = this
      const _urls = []
      deps.forEach((dep, index) => {
        _urls[index] = Module.depUrls(dep)
      })
      return _urls
    }
    // 将父级对象放入子级的的_entry中(在子级加载完成后触发父级的回调)
    pushParent() {
      const { _entry, deps, history, depsObj } = this
      for(let i = 0; i < _entry.length; i++) {
        let count = 0
        deps.forEach(dep => {
          if (!history.hasOwnProperty(dep)) {
            count++
            history[dep] = true
            depsObj[dep]._entry.push(_entry[i])
          }
        })
        if (count > 0) {
          // 记录加入的模块 触发时保证是最后一个模块在触发回调
          _entry[i].remain += count - 1
          _entry.shift()
          // 往回走是为了 删除_entry中的Module对象直到为空(一直往下传会传到最后一层, 为了最后加载的文件能够找到回调函数)
          i--
        }
      }
    }   
    // 工具方法
    static use(deps, callBack, url) {
      const mod = Module.getDeps(url, deps)
      mod._entry = [mod]
      // 记录父级_entry 是否已经放入子级
      mod.history = {}
      mod.remain = 1
      mod.callBack = function() {
        callBack()
      }
      mod.load()
    }
    // 获取依赖 或者 创建依赖
    static getDeps(url, deps) {
      // 创建时 将模块加入到cached中
      return cached[url] || (cached[url] = new Module(url, deps))
    }
    // 获取依赖路径数组
    static depUrls(dep) {
      const _url = createUrl(dep)
      return _url
    }
  }


  mySea.use = function(deps, callBack, url) {
    // 第一步先创建根Module
    Module.use(deps, callBack, `${loac}_use_${cid()}`)
  }

  function define(callBack) {
    console.log(callBack);
  }

})(this)