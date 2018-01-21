/**
 * 优酷相关的爬虫处理方法
 * 参考 service.js 的写法
 */
'use strict'
const json2csv = require('json2csv')
// const csv = require('csv-parser')
const fs = require('fs')

const cheerio = require('cheerio')
const moment = require('moment')
moment.locale('cn')
const debug = require('debug')('crawler')
let config = require('config')

import superagent from 'superagent'
import {getNextCode, getHashCode,} from '../utils/global'
import Service from '../service'
import ES from '../utils/es'


/**
 * 提供 ES 存储等公共服务给每个爬虫，也有一些ES访问的方法示例
 * @type {{}}
 */
const Youku = {}
// export default Service

Youku.a = 'b'


/**
 * 测试方法
 * @returns {Promise.<T>}
 */
Youku.get = async () => {
    debug('get', 'test it')
}

Youku.get()

export default Youku
