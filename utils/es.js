/**
 * elasticsearch util
 */
'use strict'
const debug = require('debug')('es')


import {dynamic_templates} from './es-mapping'

const _es = require('elasticsearch')
let config = require('config')

/*{ host: 'localhost:9200', log: 'info', apiVersion: '5.0', keepAlive: true }*/
const cf = config.get('ES.Client')
const client = new _es.Client({ host: cf.host, log: cf.log, apiVersion: cf.apiVersion, keepAlive: cf.keepAlive })
//const client = new _es.Client({host: 'localhost:9200', log: 'info', apiVersion: '5.0', keepAlive: true})

const ES = {}
export default ES


ES.client = client

ES.indexDB = config.get('ES.index')
debug('********** 数据库：', ES.indexDB)

ES.types = {
    article: 'a',
}


/**
 * 根据key获取标准 es 参数
 * @param type
 * @returns {{code: *, index: string, type: *}}
 */
ES.getOptions = (type) => {

    let key = ES.types[type] || type


    return {
        code: getNextCode(key),
        index: ES.indexDB,
        type: type,
        key: key,
    }
}


/**
 * 用表来获取 Code
 * todo uuid或者参考deviceid message生成方法
 */
client.getCode = (key) => {
    return key + +new Date() // 临时id可以用这个方式，前缀+时间戳
}

client.indices.exists({
    index: ES.indexDB,
}).then(res => {
    debug('indices.exists', res)
    if (!res) {
        //创建 Index
        client.indices.create({
            index: ES.indexDB,
        })
    }
}).catch(res => {
    debug('indices.exists error', res)
})


client.indices.putTemplate({
    name: 'youkb-indices-template',
    body: {
        template: 'youkb*',
        mappings: {
            _default_: {
                dynamic_templates: dynamic_templates
            }
        }
    }
}).catch(res => {
    debug('putMapping error', res)
})


// client.ping({
//     requestTimeout: 3000,
//     // undocumented params are appended to the query string
//     hello: "bot"
// }).then(res => {
//     debug('我是es，我很好', res)
// }).catch(res => {
//     debug('SOS！ES 集群宕机了!', res)
// })
