'use strict'
const json2csv = require('json2csv')
// const csv = require('csv-parser')
const fs = require('fs')

const cheerio = require('cheerio')
const moment = require('moment')
moment.locale('cn')
const debug = require('debug')('service')
let config = require('config')

import superagent from 'superagent'
import {getNextCode, getHashCode,} from './utils/global'
import ES from './utils/es'


/**
 * 提供 ES 存储等公共服务给每个爬虫，也有一些ES访问的方法示例
 * @type {{}}
 */
const Service = {}
// export default Service

Service.esClient = ES.client

debug("*******************************************")


/**
 * 如果没有内部会报404，如果只是检查存在不存在用 exists
 * @param type
 * @param id
 * @returns {Promise.<T>}
 */
Service.get = (type, id) => {
    let options = ES.getOptions(type)

    return ES.client.get({
        index: options.index,
        type: options.type,
        id: id,
    }).then(res => {
        // debug('get', type, id, res._id)
        let doc = null
        if (res.found) {
            doc = res._source
            doc._id = res._id
            doc._version = res._version
        }
        return doc

    }).catch(err => {
        debug('ES get 无', type, id, err.statusCode, err.message, err.response)
    })
}

/**
 * 判断是否存在某个文档
 * @param type
 * @param id
 * @returns {Promise.<T>}
 */
Service.exists = (type, id) => {
    let options = ES.getOptions(type)

    return ES.client.exists({
        index: options.index,
        type: options.type,
        id: id,
    }).then(res => {
        debug('存在？', type, id, res)

        return res

    }).catch(err => {
        debug('存在？', type, id, err)
    })
}

Service.mgetByIds = (type, ids) => {
    let options = ES.getOptions(type)

    return ES.client.mget({
        index: options.index,
        type: options.type,
        body: {ids: ids}
    }).then(res => {
        // debug('service.mgetByIds', res)
        return res.docs
    }).catch(err => {
        debug('mgetByIds', type, err)
    })
}


Service.find = (type, q, size = 10000) => {
    let options = ES.getOptions(type)

    return ES.client.search({
        index: options.index,
        type: options.type,
        q: q,
        size: size,
    }).then(res => {
        // debug('find', type, q, res)
        return res.hits
    }).catch(err => {
        debug('Search', type, q, err)
    })
}

Service.findOne = (type, q) => {
    return Service.find(type, q, 1).then(res => {
        debug('findOne', res)
        return res.total > 0 ? res.hits[0] : null
    })
}


/**
 * 通用新建方法
 *
 * @param type
 * @param body
 * @param id
 * @returns {Promise<R>|Promise.<T>}
 */
Service.create = async (type, body, id) => {
    const doc = await Service.get(type, id)
    if (doc) {
        _fillDate(body, 'updatedAt')
    } else {
        _fillDate(body, 'createdAt', 'updatedAt')
    }

    let options = ES.getOptions(type)

    return ES.client.index({
        index: options.index,
        type: options.type,
        id: id,
        refresh: true,
        body: body
    }).then(res => {
        // debug('创建/更新', type, body, res.result)
        return res
    }).catch(err => {
        debug('创建/更新', type, err)
    })
}


/**
 * 通用更新方法
 *
 * @param type
 * @param id
 * @param doc
 * @returns {Promise<R>|Promise.<T>}
 */
Service.update = (type, id, doc) => {

    _fillDate(doc, 'updatedAt')
    let options = ES.getOptions(type)

    return ES.client.update({
        index: options.index,
        type: options.type,
        id: id,
        refresh: true, //强制刷新
        retryOnConflict: 5, //冲突重试
        body: {doc: doc},
    }).then(res => {
        debug('update', type, id)
        return res
    }).catch(err => {
        debug('update', type, id, doc,
            err.displayName === 'Conflict' ? err.message : err)
    })
}

/**
 * 批量更新文档
 * @param type
 * @param doc
 * @returns {Promise.<void>}
 */
Service.updateAllByType = async (type, doc) => {
    let options = ES.getOptions(type)

    ES.client.search({
        index: options.index,
        type: options.type,
        size: 1000
    }).then(async (res) => {

        debug('更新所有文档', type, res.hits.total)
        if (res.hits.total > 0) {
            let articles = res.hits.hits
            for (let i = 0; i < articles.length; i++) {
                debug('更新', i, articles[i]._id, articles[i]._source.name)
                // continue
                await Service.update(type, articles[i]._id, doc)
            }
        }
    }).catch(err => {
        debug('更新所有文档', type, err)
    })
}


Service.delete = async (type, id) => {
    let options = ES.getOptions(type)

    return ES.client.delete({
        index: options.index,
        type: options.type,
        id: id,
    }).then(res => {
        debug('删除文档', type, id, res)
        return res
    }).catch(err => {
        debug('delete', type, id, err)
    })
}

/**
 * 删除工具
 * @param type
 * @returns {Promise.<void>}
 */
Service.deleteType = async (type) => {
    let options = ES.getOptions(type)

    ES.client.search({
        index: options.index,
        type: options.type,
        size: 1000
    }).then(res => {

        debug('删除所有文档', type, res.hits.total)

        if (res.hits.total > 0) {
            let articles = res.hits.hits

            for (let i = 0; i < articles.length; i++) {
                Service.delete(type, articles[i]._id)
            }
        }
    }).catch(err => {
        debug('Search', type, err)
    })
}


/**
 * 为data对象添加名为 key 的时间值
 */
let _fillDate = (data, ...keys) => {
    //todo es加mapping后改为传入时间戳
    // let t = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    let t = +new Date()
    keys.forEach(key => {
        data[key] = t
    })
}


/**
 * 写入文件，先json转csv
 * @param f
 * @param data
 * @param fields
 * @returns {Promise.<*>}
 */
Service.writeJsonDataToCsvFile = async (f, data, fields) => {

    let csv = json2csv({data: data, fields: fields})

    f = 'doc/' + moment().format('YYMMDD-') + f
    fs.writeFile(f, csv, function (err) {
        if (err) throw err
        console.log('file saved')
    })
}


/**
 * 遍历所有文章
 * @returns {Promise.<T>}
 */
Service.reprocessArticleByScroll = async () => {
    let body = {
        query: {match_all: {},}
        // query: {bool: {must: [{range: {createdAt: {gte: "now-1d/d-8h", lt: "now/d-8h"}}}],}}
    }

    const type = 'article'
    let options = ES.getOptions(type)

    let articleArr = []
    let counter = 0
    return ES.client.search({
        index: options.index,
        type: options.type,
        body: body,
        scroll: '30s', // keep the search results "scrollable" for 30 seconds
        // source: ['title'], // filter the source to only include the title field
        // q: 'title:test'
    }, function getMoreUntilDone(error, res) {
        if (res.hits) {
            debug(counter, '找到分析结果共', res.hits.total)
        }

        // collect the title from each res
        res.hits.hits.forEach(async function (hit) {
            // allTitles.push(hit._source.title);
            counter++
            try {
                let article = hit._source
                article._id = hit._id

                // do sth.
            } catch (err) {
                debug('文章处理错误scroll', err)
            }
        })

        if (res.hits.total > counter) {
            // ask elasticsearch for the next set of hits from this search
            ES.client.scroll({
                scrollId: res._scroll_id,
                scroll: '30s'
            }, getMoreUntilDone);
        } else {
            let fields = ['no', 'time', 'userId', 'content']
            let csv = json2csv({data: articleArr, fields: fields})

            fs.writeFile('file.csv', csv, function (err) {
                if (err) throw err
                console.log('file saved')
            })
            console.log('Scroll article done', counter)
        }
    })

}


Service.updateUser = (userId, data) => {
    return Service.update('user', userId, data)
}


/**
 * 获取一个人本周已经上传文章
 * @param userId
 * @returns {Promise.<T>}
 */
Service.getArticlesIn10Secs = async (userId) => {

    let weekStartAt = moment().valueOf() - 10000
    let body = {
        // query: { match_all: {}, }
        query: {
            bool: {
                must: [
                    {'term': {userId: userId}},
                    {range: {createdAt: {gte: weekStartAt}}}
                ],
            }
        }
    }

    const type = 'article'
    let options = ES.getOptions(type)

    return ES.client.search({
        index: options.index,
        type: options.type,
        body: body,
    }).then(res => {
        // debug('find', type, body, res)
        return res.hits
    }).catch(err => {
        debug('Search', type, body, err)
    })
}


Service.getArticles = async (userId, size = 20) => {
    return Service.find('article', 'userId:' + userId, size)
}


export default Service
